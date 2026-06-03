// Sample Unipole/Monopole hoarding inventory
// id, name, city, state, price (monthly), size (WxH ft), lighting, availability, imageURL, lat, lng, orientation, height, traffic, category
const UnipoleData = [
  {
    id: "uni-101",
    name: "Minto Road, Delhi",
    city: "Delhi",
    state: "Delhi",
    price: 45000,
    size: "20x10",
    lighting: "Front-lit",
    available: true,
    imageURL: "/unipole/delhi-minto.jpg",
    lat: 28.6426,
    lng: 77.2256,
    orientation: "East-facing",
    height: "30ft from ground",
    traffic: "High vehicular traffic, signal junction",
    category: "Unipole"
  },
  {
    id: "uni-102",
    name: "NH48, Near Vashi",
    city: "Mumbai",
    state: "Maharashtra",
    price: 52000,
    size: "40x20",
    lighting: "Back-lit",
    available: false,
    imageURL: "/unipole/mumbai-vashi.jpg",
    lat: 19.0771,
    lng: 73.0169,
    orientation: "North-facing",
    height: "40ft from ground",
    traffic: "Expressway toll approach, peak hours",
    category: "Unipole"
  },
  {
    id: "mono-201",
    name: "Outer Ring Road, Hebbal",
    city: "Bengaluru",
    state: "Karnataka",
    price: 38000,
    size: "20x10",
    lighting: "None",
    available: true,
    imageURL: "/unipole/blr-hebbal.jpg",
    lat: 13.0352,
    lng: 77.5970,
    orientation: "South-facing",
    height: "28ft from ground",
    traffic: "IT corridor daily commuters",
    category: "Monopole"
  }
];

export const STATES = [
  { state: "Delhi", cities: ["Delhi"] },
  { state: "Maharashtra", cities: ["Mumbai", "Pune"] },
  { state: "Karnataka", cities: ["Bengaluru"] }
];

export default UnipoleData;
