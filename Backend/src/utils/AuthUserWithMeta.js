import { USER_TYPES } from "../constants/user.js";
import { supabase } from "../config/supabase.js";

const GetAuthUserWithMeta = async (user) => {
  let institution = null;
  let department = null;

  try {
    // Fetch user's institution membership
    const { data: instMembership } = await supabase
      .from("institution_memberships")
      .select("institution_id, institutions(id, name)")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .single();

    if (instMembership?.institutions) {
      institution = {
        id: instMembership.institutions.id,
        name: instMembership.institutions.name,
      };
    }

    // Fetch user's department membership
    const { data: deptMembership } = await supabase
      .from("department_memberships")
      .select("department_id, departments(id, name)")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .single();

    if (deptMembership?.departments) {
      department = {
        id: deptMembership.departments.id,
        name: deptMembership.departments.name,
      };
    }
  } catch (error) {
    // If no memberships found, that's OK - user just hasn't joined yet
    console.log("User has no institution/department memberships yet");
  }

  return {
    user: typeof user.toObject === "function" ? user.toObject() : user,
    meta: {
      institution,
      department,
      is_app_admin: user.user_type === USER_TYPES.ADMIN,
      is_app_moderator: user.user_type === USER_TYPES.MODERATOR,
      is_teacher: user.user_type === USER_TYPES.TEACHER,
    },
  };
};

export { GetAuthUserWithMeta };
