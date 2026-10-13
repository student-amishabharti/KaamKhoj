import Explore from "@/components/Explore";

// Purana link "/search" (Kaarigar dekho) ab Explore ke "Kaarigar dekho" tab par. "?category=" bhi chalta hai.
export default function SearchPage() {
  return <Explore initial="workers" />;
}
