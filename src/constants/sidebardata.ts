import icons from "./icon";

export const sidebarMenu = [
  {
    key: "dashboard",
    label: "Overview",
    icon: icons.dashboard,
    path: "dashboard",
  },
  {
    type: "label",
    label: "Manage",
  },
  {
    key: "availability",
    label: "Availability",
    icon: icons.availability,
    path: "availability",
  },
  {
    key: "bookings",
    label: "Bookings",
    icon: icons.booking,
    path: "bookings",
  },
  {
    key: "vehicle",
    label: "Vehicles",
    icon: icons.vehicle,
    subMenu: [
      { key: "availablevehicles", label: "Available Vehicles", path: "availablevehicles" },
      { key: "maintenance", label: "Maintenance", path: "maintenance" },
    ],
  },
];
