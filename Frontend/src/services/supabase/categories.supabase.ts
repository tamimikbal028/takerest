import { supabase, getActiveUserId } from "@/config/supabase";
import type { ApiResponse, Category } from "@/types";

export const supabaseGetCategories = async (): Promise<
  ApiResponse<{ categories: Category[] }>
> => {
  const userId = await getActiveUserId();

  const { data, error } = await supabase
    .from("categories")
    .select("*, activities(*)")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch categories");
  }

  let categoriesData = data || [];

  // Safeguard: provision starter categories if user has none
  if (categoriesData.length === 0) {
    const { data: studyCat } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: "Study",
        color: "#3B82F6",
        icon: "book-open",
        is_system_default: true,
        sort_order: 1,
      })
      .select()
      .single();

    if (studyCat) {
      await supabase.from("activities").insert([
        {
          user_id: userId,
          category_id: studyCat.id,
          name: "Course 1",
          sort_order: 1,
        },
        {
          user_id: userId,
          category_id: studyCat.id,
          name: "Course 2",
          sort_order: 2,
        },
        {
          user_id: userId,
          category_id: studyCat.id,
          name: "Course 3",
          sort_order: 3,
        },
      ]);
    }

    const { data: othersCat } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: "Others",
        color: "#64748B",
        icon: "clock",
        is_system_default: false,
        sort_order: 2,
      })
      .select()
      .single();

    if (othersCat) {
      await supabase.from("activities").insert([
        {
          user_id: userId,
          category_id: othersCat.id,
          name: "Rest",
          sort_order: 1,
        },
        {
          user_id: userId,
          category_id: othersCat.id,
          name: "Meal",
          sort_order: 2,
        },
        {
          user_id: userId,
          category_id: othersCat.id,
          name: "Break",
          sort_order: 3,
        },
      ]);
    }

    const { data: refreshed } = await supabase
      .from("categories")
      .select("*, activities(*)")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    categoriesData = refreshed || [];
  }

  const categories: Category[] = (categoriesData as Category[]).map((cat) => ({
    ...cat,
    activities: (cat.activities || []).sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    ),
  }));

  return {
    statusCode: 200,
    success: true,
    message: "Categories fetched successfully",
    data: { categories },
  };
};

export const supabaseCreateCategory = async (
  categoryData: Partial<Category>
): Promise<ApiResponse<{ category: Category }>> => {
  const userId = await getActiveUserId();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: categoryData.name,
      color: categoryData.color || "#3B82F6",
      icon: categoryData.icon || "folder",
      is_system_default: categoryData.is_system_default ?? false,
      sort_order: categoryData.sort_order ?? 0,
    })
    .select("*, activities(*)")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create category");
  }

  return {
    statusCode: 201,
    success: true,
    message: "Category created successfully",
    data: { category: { ...data, activities: [] } },
  };
};

export const supabaseUpdateCategory = async (
  id: string,
  categoryData: Partial<Category>
): Promise<ApiResponse<{ category: Category }>> => {
  const userId = await getActiveUserId();

  const updatePayload: Partial<Category> = {};
  if (categoryData.name !== undefined) updatePayload.name = categoryData.name;
  if (categoryData.color !== undefined)
    updatePayload.color = categoryData.color;
  if (categoryData.icon !== undefined) updatePayload.icon = categoryData.icon;
  if (categoryData.sort_order !== undefined)
    updatePayload.sort_order = categoryData.sort_order;

  const { data, error } = await supabase
    .from("categories")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*, activities(*)")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update category");
  }

  return {
    statusCode: 200,
    success: true,
    message: "Category updated successfully",
    data: { category: data },
  };
};

export const supabaseDeleteCategory = async (
  id: string
): Promise<ApiResponse<{ deletedId: string }>> => {
  const userId = await getActiveUserId();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to delete category");
  }

  return {
    statusCode: 200,
    success: true,
    message: "Category deleted successfully",
    data: { deletedId: id },
  };
};
