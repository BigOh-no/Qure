# Test Plan and Results

## Testing Strategy

A Sandwich Testing approach was taking in regards to Integration Testing. The reason for this is that the use of external services like Supabase and Google OAuth required the use of Stub to mock the results from these systems, additionally since components and functions were created asynchronously drivers were used to simulate high-level executions for consistent testing practices across all test files

## Test Cases

### Example of a Supabase Mock

<p align="center">
  <img src="SupabaseMock.png" alt="Supabase Mock (Stub to simulate Low-Level Execution)" width="500">
</p>

### Example of Test Case for UI functionality

<p align="center">
  <img src="UITestCase.png" alt="Example of Test for UI navigation functionality" width="500">
</p>

### Example of Test Case for backend functionality

<p align="center">
  <img src="BackendTestCase.png" alt="Example of Test for backend functionality" width="500">
</p>

## Results of Testing

Test Coverage stayed consistently above the threshold for each Sprint (Sprint 1 did not have a coverage requirement)

### Sprint 2 Coverage

<p align="center">
  <img src="S2Coverage.png" alt="Sprint 2 Code Coverage" width="500">
</p>

### Sprint 3 Coverage

<p align="center">
  <img src="S3Coverage.png" alt="Sprint 3 Code Coverage" width="500">
</p>

### Sprint 4 Coverage