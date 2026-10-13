import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerDetailRoute, CustomerDetailSkeleton } from "@/components/customer/customer-detail";

export const metadata: Metadata = {
  title: "Client",
};

export default function CustomerPage() {
  // useParams() suspends for dynamic params under cacheComponents, so it needs this boundary.
  return (
    <Suspense fallback={<CustomerDetailSkeleton />}>
      <CustomerDetailRoute />
    </Suspense>
  );
}
