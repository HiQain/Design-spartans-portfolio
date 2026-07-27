import { NextResponse } from "next/server";
import { getCategories, getCategoryPaneData } from "@/lib/portfolio";

export async function GET(_request: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;

  const categories = await getCategories();
  const category = categories.find((item) => item.id === categoryId);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const paneData = await getCategoryPaneData(category, categories);
  return NextResponse.json(paneData);
}
