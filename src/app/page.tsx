import MobileNavigationBar from "@/components/MobileNavigationBar";
import NavigationBar from "@/components/NavigationBar";
import QueryComponent from "@/components/QueryComponent";
import "@/styles/global.css";

export default function Home() {
  return (
    <div>
      <NavigationBar />
      <QueryComponent />
      <MobileNavigationBar />
    </div>
  );
}
