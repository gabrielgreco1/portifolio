import PortfolioDocument from "@/components/PortfolioDocument";
import { portfolioMetadata } from "@/lib/seo";

export const metadata = portfolioMetadata("pt");
export const viewport = { themeColor: "#f7f6f2" };

export default function Layout({ children }) {
  return <PortfolioDocument lang="pt">{children}</PortfolioDocument>;
}
