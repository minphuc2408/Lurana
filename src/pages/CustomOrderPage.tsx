import { CustomOrderView, useCustomOrder } from "@/features/custom-order";
export default function CustomOrderPage() {
  const model = useCustomOrder();
  return <CustomOrderView {...model} />;
}
