
import {
  QUEUE_OPEN_TIME,
  QUEUE_CLOSE_TIME,
  AVERAGE_CONSULTATION_MINUTES,
  getTodayDateString,
  isQueueOpenNow,
  calculateEstimatedWait,
  getTodayQueueForClinic,
  getMyQueueEntryForClinic,
  getMyActiveQueueStatusForToday,
  joinQueue,
  leaveQueue,
} from "../pages/queueService";

import { supabaseClient } from "../lib/supabaseClient";

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe("queueService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constants", () => {
    it("should export correct constants", () => {
      expect(QUEUE_OPEN_TIME).toBe("08:00");
      expect(QUEUE_CLOSE_TIME).toBe("17:00");
      expect(AVERAGE_CONSULTATION_MINUTES).toBe(15);
    });
  });

  describe("getTodayDateString", () => {
    it("should return today's date in YYYY-MM-DD format", () => {
      const result = getTodayDateString();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("isQueueOpenNow", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return true during queue hours", () => {
      jest.setSystemTime(new Date("2026-05-09T10:00:00"));

      expect(isQueueOpenNow()).toBe(true);
    });

    it("should return false before opening hours", () => {
      jest.setSystemTime(new Date("2026-05-09T07:59:00"));

      expect(isQueueOpenNow()).toBe(false);
    });

    it("should return false after closing hours", () => {
      jest.setSystemTime(new Date("2026-05-09T17:00:00"));

      expect(isQueueOpenNow()).toBe(false);
    });
  });

  describe("calculateEstimatedWait", () => {
    it("should return 0 for invalid positions", () => {
      expect(calculateEstimatedWait()).toBe(0);
      expect(calculateEstimatedWait(0)).toBe(0);
      expect(calculateEstimatedWait(1)).toBe(0);
    });

    it("should calculate wait correctly", () => {
      expect(calculateEstimatedWait(2)).toBe(15);
      expect(calculateEstimatedWait(5)).toBe(60);
    });
  });

  describe("getTodayQueueForClinic", () => {
    it("should return queue entries", async () => {
      const mockData = [{ id: 1 }, { id: 2 }];

      const orderMock = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const inMock = jest.fn(() => ({
        order: orderMock,
      }));

      const eq2Mock = jest.fn(() => ({
        in: inMock,
      }));

      const eq1Mock = jest.fn(() => ({
        eq: eq2Mock,
      }));

      const selectMock = jest.fn(() => ({
        eq: eq1Mock,
      }));

      supabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      const result = await getTodayQueueForClinic("clinic-1");

      expect(result).toEqual(mockData);
      expect(supabaseClient.from).toHaveBeenCalledWith("queue_entries");
    });

    it("should throw if query fails", async () => {
      const mockError = new Error("DB error");

      const orderMock = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const inMock = jest.fn(() => ({
        order: orderMock,
      }));

      const eq2Mock = jest.fn(() => ({
        in: inMock,
      }));

      const eq1Mock = jest.fn(() => ({
        eq: eq2Mock,
      }));

      const selectMock = jest.fn(() => ({
        eq: eq1Mock,
      }));

      supabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      await expect(getTodayQueueForClinic("clinic-1")).rejects.toThrow(
        "DB error"
      );
    });
  });

  describe("getMyQueueEntryForClinic", () => {
    it("should return queue entry for logged in user", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "user-1" },
        },
        error: null,
      });

      const mockEntry = { id: "entry-1" };

      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: mockEntry,
        error: null,
      });

      const inMock = jest.fn(() => ({
        maybeSingle: maybeSingleMock,
      }));

      const eq3Mock = jest.fn(() => ({
        in: inMock,
      }));

      const eq2Mock = jest.fn(() => ({
        eq: eq3Mock,
      }));

      const eq1Mock = jest.fn(() => ({
        eq: eq2Mock,
      }));

      const selectMock = jest.fn(() => ({
        eq: eq1Mock,
      }));

      supabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      const result = await getMyQueueEntryForClinic("clinic-1");

      expect(result).toEqual(mockEntry);
    });

    it("should throw if user is not logged in", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: null,
        },
        error: null,
      });

      await expect(
        getMyQueueEntryForClinic("clinic-1")
      ).rejects.toThrow("You must be logged in to use the queue.");
    });
  });

  describe("getMyActiveQueueStatusForToday", () => {
    it("should return queue status with position and estimated wait", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "user-1" },
        },
        error: null,
      });

      const queueEntry = {
        id: "entry-1",
        clinic_id: "clinic-1",
      };

      const clinic = {
        id: "clinic-1",
        name: "Clinic A",
      };

      const queue = [
        { id: "entry-1" },
        { id: "entry-2" },
      ];

      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: queueEntry,
        error: null,
      });

      const singleMock = jest.fn().mockResolvedValue({
        data: clinic,
        error: null,
      });

      const orderMock = jest.fn().mockResolvedValue({
        data: queue,
        error: null,
      });

      supabaseClient.from
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  maybeSingle: maybeSingleMock,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              single: singleMock,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  order: orderMock,
                }),
              }),
            }),
          }),
        });

      const result = await getMyActiveQueueStatusForToday();

      expect(result).toEqual({
        entry: queueEntry,
        clinic,
        position: 1,
        estimatedWait: 0,
      });
    });

    it("should return null when no active entry exists", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "user-1" },
        },
        error: null,
      });

      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      supabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                maybeSingle: maybeSingleMock,
              }),
            }),
          }),
        }),
      });

      const result = await getMyActiveQueueStatusForToday();

      expect(result).toBeNull();
    });
  });

  describe("joinQueue", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-05-09T10:00:00"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should join queue successfully", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "user-1" },
        },
        error: null,
      });

      const insertedEntry = {
        id: "entry-1",
        clinic_id: "clinic-1",
      };

      const insertSingleMock = jest.fn().mockResolvedValue({
        data: insertedEntry,
        error: null,
      });

      supabaseClient.from
        // getMyActiveQueueStatusForToday query
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
        // insert query
        .mockReturnValueOnce({
          insert: () => ({
            select: () => ({
              single: insertSingleMock,
            }),
          }),
        });

      const result = await joinQueue("clinic-1");

      expect(result).toEqual(insertedEntry);
    });

    it("should throw if queue is closed", async () => {
      jest.setSystemTime(new Date("2026-05-09T18:00:00"));

      await expect(joinQueue("clinic-1")).rejects.toThrow(
        "The queue is currently closed"
      );
    });

    it("should throw if already in queue", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "user-1" },
        },
        error: null,
      });

      const queueEntry = {
        id: "entry-1",
        clinic_id: "clinic-1",
      };

      const clinic = {
        id: "clinic-1",
        name: "Clinic A",
      };

      const queue = [
        { id: "entry-1" },
        { id: "entry-2" },
      ];

      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: queueEntry,
        error: null,
      });

      const singleMock = jest.fn().mockResolvedValue({
        data: clinic,
        error: null,
      });

      const orderMock = jest.fn().mockResolvedValue({
        data: queue,
        error: null,
      });

      supabaseClient.from
        // active queue lookup
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  maybeSingle: maybeSingleMock,
                }),
              }),
            }),
          }),
        })

        // clinic lookup
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              single: singleMock,
            }),
          }),
        })

        // queue lookup for position calculation
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  order: orderMock,
                }),
              }),
            }),
          }),
        });

      await expect(joinQueue("clinic-1")).rejects.toThrow(
        "ALREADY_IN_QUEUE"
      );
    });
  });

  describe("leaveQueue", () => {
    it("should cancel queue entry", async () => {
      const updatedEntry = {
        id: "entry-1",
        status: "cancelled",
      };

      const singleMock = jest.fn().mockResolvedValue({
        data: updatedEntry,
        error: null,
      });

      supabaseClient.from.mockReturnValue({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: singleMock,
            }),
          }),
        }),
      });

      const result = await leaveQueue("entry-1");

      expect(result).toEqual(updatedEntry);
    });

    it("should throw on update error", async () => {
      const mockError = new Error("Update failed");

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      supabaseClient.from.mockReturnValue({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: singleMock,
            }),
          }),
        }),
      });

      await expect(leaveQueue("entry-1")).rejects.toThrow(
        "Update failed"
      );
    });
  });
});