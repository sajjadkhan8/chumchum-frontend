import { redirect } from "next/navigation";

export default function BrandSavedPage() {
  redirect("/brand/explore?view=saved");
}
