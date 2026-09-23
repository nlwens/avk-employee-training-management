import type { User } from "@api/src";

const mockUserDefaults = {
  admin: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  localeCode: "en" as const,
};

export const mockUserJohn: User = {
  id: "user-1",
  name: "John",
  surname: "Doe",
  email: "john.doe@example.com",
  groups: [{ id: "group-a", name: "Group A" }],
  ...mockUserDefaults,
  createdAt: "2024-06-01T00:00:00.000Z",
};

export const mockUserJane: User = {
  id: "user-2",
  name: "Jane",
  surname: "Lee",
  email: "jane.lee@example.com",
  groups: [{ id: "group-b", name: "Group B" }],
  ...mockUserDefaults,
  createdAt: "2024-01-15T00:00:00.000Z",
};

export const mockUsers: User[] = [mockUserJohn, mockUserJane];

export const mockUsersForGroupTable: User[] = [
  mockUserJohn,
  {
    ...mockUserJane,
    groups: [
      { id: "group-b", name: "Group B" },
      { id: "group-c", name: "Group C" },
    ],
  },
];
