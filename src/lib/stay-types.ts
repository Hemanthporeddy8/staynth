export const STAY_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "boutique-hotel", label: "Boutique hotel" },
  { value: "hostel", label: "Hostel" },
  { value: "homestay", label: "Homestay" },
  { value: "guest-house", label: "Guest house" },
  { value: "pg", label: "PG / paying guest" },
  { value: "resort", label: "Resort" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "serviced-apartment", label: "Serviced apartment" },
  { value: "cottage", label: "Cottage" },
  { value: "farmstay", label: "Farm stay" },
  { value: "houseboat", label: "Houseboat" },
  { value: "tent", label: "Tent / glamping" },
  { value: "lodge", label: "Lodge" },
  { value: "plot", label: "Plot / land (sale)" },
] as const;

export function stayTypeLabel(value: string) {
  return STAY_TYPES.find((item) => item.value === value)?.label ?? value.replace(/-/g, " ");
}
