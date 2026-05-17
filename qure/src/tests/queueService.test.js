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

const createSupabaseMock = (responses = []) => {
  supabaseClient.from.mockImplementation(() => {
    const chain = {};

    const next = () => responses.shift();

    chain.select = () => chain;
    chain.eq = () => chain;
    chain.in = () => chain;

    chain.order = async () => next();

    chain.single = async () => next();
    chain.maybeSingle = async () => next();

    chain.insert = () => chain;
    chain.update = () => chain;

    return chain;
  });
};

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
      expect(getTodayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("isQueueOpenNow", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

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
      createSupabaseMock([
        { data: [{ id: 1 }, { id: 2 }], error: null },
      ]);

      const result = await getTodayQueueForClinic("clinic-1");
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("should throw if query fails", async () => {
      createSupabaseMock([
        {
          data: null,
          error: { message: "DB error" },
        },
      ]);

      await expect(
        getTodayQueueForClinic("clinic-1")
      ).rejects.toThrow("DB error");
    });
  });

  describe("getMyQueueEntryForClinic", () => {
    it("should return queue entry for logged in user", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });

      createSupabaseMock([
        { data: { id: "entry-1" }, error: null },
      ]);

      const result = await getMyQueueEntryForClinic("clinic-1");
      expect(result).toEqual({ id: "entry-1" });
    });

    it("should throw if user is not logged in", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(
        getMyQueueEntryForClinic("clinic-1")
      ).rejects.toThrow(
        "You must be logged in to use the queue."
      );
    });
  });

  describe("getMyActiveQueueStatusForToday", () => {
    it("should return queue status with position and estimated wait", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });

      createSupabaseMock([
        { data: { id: "entry-1", clinic_id: "clinic-1" }, error: null },
        { data: { id: "clinic-1", name: "Clinic A" }, error: null },
        { data: [{ id: "entry-1" }, { id: "entry-2" }], error: null },
      ]);

      const result = await getMyActiveQueueStatusForToday();

      expect(result).toEqual({
        entry: { id: "entry-1", clinic_id: "clinic-1" },
        clinic: { id: "clinic-1", name: "Clinic A" },
        position: 1,
        estimatedWait: 0,
      });
    });

    it("should return null when no active entry exists", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });

      createSupabaseMock([
        { data: null, error: null },
      ]);

      const result = await getMyActiveQueueStatusForToday();
      expect(result).toBeNull();
    });
  });

  describe("joinQueue", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-05-09T10:00:00"));
    });

    afterEach(() => jest.useRealTimers());

    it("should join queue successfully", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });

      createSupabaseMock([
        { data: null, error: null }, // entry check
        { data: { id: "clinic-1", open_t: "08:00", closed_t: "17:00" }, error: null }, // clinic
        { data: null, error: null }, // active status entry check
        { data: { id: "clinic-1", name: "Clinic A" }, error: null }, // clinic in status
        { data: { id: "entry-1" }, error: null }, // insert result
      ]);

      supabaseClient.from.mockImplementation((table) => {
        const chain = {};
        const next = () => [];

        chain.select = () => chain;
        chain.eq = () => chain;
        chain.in = () => chain;

        chain.order = async () => {
          if (table === "queue_entries") {
            return {
              data: [{ id: "entry-1" }, { id: "entry-2" }],
              error: null,
            };
          }
          return next();
        };

        chain.insert = () => ({
          select: () => ({
            single: async () => ({
              data: { id: "entry-1", clinic_id: "clinic-1" },
              error: null,
            }),
          }),
        });

        chain.single = async () => next();
        chain.maybeSingle = async () => next();

        chain.update = () => chain;

        return chain;
      });

      const result = await joinQueue("clinic-1");

      expect(result).toEqual({
        id: "entry-1",
        clinic_id: "clinic-1",
      });
    });

    it("should throw if queue is closed", async () => {
      jest.setSystemTime(new Date("2026-05-09T18:00:00"));

      createSupabaseMock([
        {
          data: { id: "clinic-1", open_t: "08:00", closed_t: "17:00" },
          error: null,
        },
      ]);

      await expect(joinQueue("clinic-1")).rejects.toThrow(
        "The queue is currently closed"
      );
    });
  });

  describe("leaveQueue", () => {
    it("should cancel queue entry", async () => {
      createSupabaseMock([
        {
          data: { id: "entry-1", status: "cancelled" },
          error: null,
        },
      ]);

      const result = await leaveQueue("entry-1");

      expect(result).toEqual({
        id: "entry-1",
        status: "cancelled",
      });
    });

    it("should throw on update error", async () => {
      createSupabaseMock([
        { data: null, error: new Error("Update failed") },
      ]);

      await expect(leaveQueue("entry-1")).rejects.toThrow("Update failed");
    });
  });
});