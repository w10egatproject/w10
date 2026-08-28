import { PurchasingPageContent } from '@/app/purchasing/page';

export default function PurchasingAllPage() {
  return (
    <PurchasingPageContent
      apiPath="/api/purchasing-all"
      pageTitle="สถานะการซื้อจ้างทั้งหมด"
      pageSubtitle="EGAT Purchasing Status All"
      fixedFilters
      showGaugePanel={false}
      tableColumnCount={10}
      colorTheme="teal"
      dateStartLabel="คาดว่าจะเสร็จ"
      showEcmLinks
      sheetUrl="https://docs.google.com/spreadsheets/d/1gAFNW67DyQjzPUBRLclT3fG-QvMVop-msOguZCEw-JY/edit"
      sheetName="จัดซื้อจัดจ้างทั้งหมด"
    />
  );
}
