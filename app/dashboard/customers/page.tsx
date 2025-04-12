// import { H1Icon } from "@heroicons/react/24/outline";
import { Metadata } from "next";
import CustomersTable from "@/app/ui/customers/table";
import { fetchCustomers, fetchFormatttedCustomers } from "@/app/lib/data";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function Page() {
  const customer = await fetchFormatttedCustomers();
  return <CustomersTable customers={customer} />;
}
