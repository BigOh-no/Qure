import { searchClinics } from "../pages/clinicService";
import { supabaseClient } from "../lib/supabaseClient";

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    from: jest.fn(),
  },
}));

describe("searchClinics", () => {
  let queryMock;

  beforeEach(() => {
    jest.clearAllMocks();

    queryMock = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn(),
    };

    supabaseClient.from.mockReturnValue(queryMock);
  });

  const mockSuccess = (data = []) => {
    queryMock.order.mockResolvedValue({
      data,
      error: null,
    });
  };

  const mockError = (error) => {
    queryMock.order.mockResolvedValue({
      data: null,
      error,
    });
  };

  test("builds basic query with no filters", async () => {
    mockSuccess([]);

    const result = await searchClinics({});

    expect(supabaseClient.from).toHaveBeenCalledWith("clinics");
    expect(queryMock.select).toHaveBeenCalledWith(
      "id, admin1, facility_name, facility_type, ownership, lat, lon, open_t, closed_t"
    );
    expect(queryMock.limit).toHaveBeenCalledWith(50);
    expect(queryMock.order).toHaveBeenCalledWith("facility_name", {
      ascending: true,
    });

    expect(result).toEqual([]);
  });

  test("applies admin1 filter", async () => {
    mockSuccess();

    await searchClinics({ admin1: "Gauteng" });

    expect(queryMock.eq).toHaveBeenCalledWith("admin1", "Gauteng");
  });

  test("applies facility type filter", async () => {
    mockSuccess();

    await searchClinics({ facilityType: "Clinic" });

    expect(queryMock.ilike).toHaveBeenCalledWith(
      "facility_type",
      "Clinic"
    );
  });

  test("applies search term prefix filter", async () => {
    mockSuccess();

    await searchClinics({ searchTerm: "Hil" });

    expect(queryMock.ilike).toHaveBeenCalledWith(
      "facility_name",
      "Hil%"
    );
  });

  test("trims search term before applying filter", async () => {
    mockSuccess();

    await searchClinics({ searchTerm: "  Hil  " });

    expect(queryMock.ilike).toHaveBeenCalledWith(
      "facility_name",
      "Hil%"
    );
  });

  test("applies multiple filters together", async () => {
    mockSuccess();

    await searchClinics({
      searchTerm: "Hil",
      admin1: "Gauteng",
      facilityType: "Clinic",
    });

    expect(queryMock.eq).toHaveBeenCalledWith("admin1", "Gauteng");

    expect(queryMock.ilike).toHaveBeenCalledWith(
      "facility_type",
      "Clinic"
    );

    expect(queryMock.ilike).toHaveBeenCalledWith(
      "facility_name",
      "Hil%"
    );
  });

  test("respects custom limit", async () => {
    mockSuccess();

    await searchClinics({ limit: 10 });

    expect(queryMock.limit).toHaveBeenCalledWith(10);
  });

  test("returns data when successful", async () => {
    const mockData = [
      {
        id: 1,
        facility_name: "Clinic A",
      },
    ];

    mockSuccess(mockData);

    const result = await searchClinics({ searchTerm: "Clinic" });

    expect(result).toEqual(mockData);
  });

  test("returns empty array when data is null", async () => {
    mockSuccess(null);

    const result = await searchClinics({});

    expect(result).toEqual([]);
  });

  test("throws error when Supabase returns error", async () => {
    const error = new Error("DB error");

    mockError(error);

    await expect(searchClinics({})).rejects.toThrow("DB error");
  });
});