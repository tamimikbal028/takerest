# AI Project Instructions - Frontend

This file is dedicated to storing the core structure, specific coding conventions, and architectural context for the **Frontend** of the Bidda project.

By keeping your instructions here, any AI assistant (like me) can consistently follow your project's rules without you having to repeat them in every conversation.

---

## 🏗️ Project Architecture & Folder Structure

_(Describe how your React/Vite/TypeScript frontend is organized here. Example below:)_

- `src/components/`: Reusable UI components.
- `src/pages/`: Page-level components (e.g., Dashboard, Login).
- `src/hooks/`: Custom React hooks.
- `src/services/`: API call definitions and service logic.
- `src/utils/`: Helper functions and utilities.

## 🛠️ Tech Stack & Conventions

_(List your primary tools and coding rules here)_

- **Framework:** React + Vite
- **Language:** TypeScript (e.g., "Always use Interfaces instead of Types for props")
- **Styling:** (e.g., Tailwind CSS, Styled Components)
- **State Management:** (e.g., React Context, Redux)

## 📌 Specific AI Rules

_(Add any strict rules you want the AI to ALWAYS follow)_

1. Do not remove existing comments unless instructed.
2. Always handle loading and error states for API calls.
3. **Service Export Object Naming**: The exported object in every service file must always be named in **plural** form, regardless of how many functions it contains. Examples: `authServices`, `roomServices`, `groupServices`, `friendServices`. Never use singular (e.g., `authService` is wrong).
4. **Strict Service File Structure**: Service files MUST NEVER define functions inline inside an exported object (e.g. `export const authServices = { login: async () => {} }` is **STRICTLY PROHIBITED**).
   - You MUST define every function individually as a `const` arrow function first.
   - Then, group them into a single object named in **plural** form (e.g., `const authServices = { ... }`).
   - **CRITICAL**: You MUST use `as const` at the end of the object grouping for absolute consistency and type safety. **NEVER FORGET THIS**.
   - **API Call Pattern**: Every service function MUST use the shared `api` instance.
   - **Response Handling**: You MUST capture the response in a variable and return `.data`. (e.g., `const response = await api.get(...); return response.data;`).
   - **Correct Pattern Example**:

     ```ts
     const login = async (credentials) => {
       const response = await api.post("/auth/login", credentials);
       return response.data;
     };

     const authServices = {
       login,
     } as const; // <--- MANDATORY 'as const'
     export default authServices;
     ```
5. **Strict Hook File Structure & Export Pattern**: Hook files (`.ts` files in `src/hooks/`) MUST follow the exact same structural pattern as service files.
   - All internal hooks MUST be grouped into a single object named in **plural** form (e.g., `const authHooks = { useLogin, useRegister }`).
   - **CRITICAL**: You MUST use `as const` at the end of the object grouping. **NEVER FORGET THIS**.
   - **Explicit Hook Typing**: Always provide explicit generics to `useQuery` and `useMutation` inside the hook definitions. This ensures proper type inference in components without manual casting (e.g., `useQuery<Tournament>`).
   - **React Query Key Rule**: Never hardcode query key strings or query key segments directly inside hooks. Define them in the appropriate constants file first (for example `src/constants/queryKeys.ts`) and reference those constants from the hook.
   - **Mandatory Hook Destructuring**: Always destructure the return value of a hook immediately upon calling. Avoid assigning the entire hook result to a variable like `const userQuery = ...`.
     - **Incorrect**: `const authQuery = authHooks.useUser();`
     - **Correct**: `const { data: user, isLoading } = authHooks.useUser();`
     - **Correct (Mutations)**: `const { mutate: login, isPending } = authHooks.useLogin();`
   - The file MUST have a single `export default authHooks;` at the bottom.
   - **Correct Pattern Example**:

     ```ts
     const useLogin = () => { ... };

     const authHooks = {
       useLogin,
     } as const; // <--- MANDATORY 'as const'
     export default authHooks;
     ```

6. **No Barrel Index Files**: Do not create or use barrel `index.ts` / `index.tsx` files for component re-exports. Always import directly from the concrete file path (for example `./Edit/PhotosTab`), and prefer deleting existing barrel files when touching that area.

7. **Route-Based Folder Nesting Pattern**: When a component acts as a route shell and owns nested routes, the file/folder structure must mirror that routing structure.
   - Keep the main route component file directly in the parent folder (for example `ProfileOverview.tsx`).
   - Put that route's child route components or supporting route-specific components inside a same-name nested folder (for example `Profile/Overview/...` for `ProfileOverview.tsx`).
   - If a child route inside that folder also becomes a route shell, repeat the same pattern again with another same-name nested folder.
   - This route-driven nesting pattern is preferred for major routed sections because it keeps the file tree aligned with the URL structure.

8. **API Response Structure Awareness**: Every API response from the backend follows a strict 3-part structure. When defining TypeScript types/interfaces for API responses, always account for this structure:
   - **`[mainDataKey]`** (e.g., `user`, `posts`, `institution`): The core data from the database.
   - **`meta?`** (optional): Additional calculated or relational fields not directly from the DB (e.g., `isFollowing`, `canEdit`, `isMine`, `isLiked`).
   - **`pagination?`** (optional): Present only in paginated responses. Always has these exact fields in this order:
     ```ts
     pagination: {
       totalDocs: number;
       limit: number;
       page: number;
       totalPages: number;
       hasPrevPage: boolean;
       hasNextPage: boolean;
     }
     ```
9. **Nested Array Response Pattern**: If the main data is an array (e.g., a list of posts), each item in the array also follows the same structure internally. For example:
   ```ts
   // A paginated posts response looks like this:
   type PostsResponse = {
     posts: Array<{
       post: Post; // core DB data
       meta: {
         // calculated fields per post
         isLiked: boolean;
         isSaved: boolean;
         isMine: boolean;
         isRead: boolean;
       };
     }>;
     pagination: Pagination;
   };
   ```
10. **Data Access in Components**: Service functions always return `response.data`. The hook wraps this in React Query. In the `.tsx` component, how you access the data depends on whether the response is paginated:
   - **Non-paginated** (uses `useQuery`): Access as `data?.data.[key]`
     ```tsx
     const { data } = useGroupDetails();
     const group = data?.data.group;
     const meta = data?.data.meta;
     ```
   - **Paginated** (uses `useInfiniteQuery`): Data is split across `pages`. Flatten it to get a single array:
     ```tsx
     const { data } = useGroupPosts();
     const posts = data?.pages.flatMap((page) => page.data.posts) ?? [];
     const pagination = data?.pages.at(-1)?.data.pagination; // last page's pagination
     ```
11. **Strict Error Typing & Handling**: Every React Query `onError` callback MUST explicitly define the error type as `AxiosError<ApiError>` or use the `handleMutationError` Higher-Order Function. You MUST NEVER write raw `toast.error` logic.
   - **Preferred Pattern (Higher-Order Function)**:

     ```ts
     import { handleMutationError } from "../utils/errorHandler";

     // inside useMutation:
     onError: handleMutationError("Default fallback message"),
     ```

   - **Alternative Pattern (For custom rollbacks/logic)**:

     ```ts
     import type { AxiosError } from "axios";
     import type { ApiError } from "../types";
     import { handleMutationError } from "../utils/errorHandler";

     // inside useMutation:
     onError: (error: AxiosError<ApiError>, _variables, context) => {
       // Rollback logic...
       handleMutationError(error, "Default fallback message");
     };
     ```

12. **Absolute Alias Imports in App Folder**: Inside the `src/app/` folder, all imports (both components, hooks, services, utils, assets, etc.) MUST use absolute paths starting with `@/` rather than relative paths (e.g. use `@/app/messages/ConversationList` instead of `./ConversationList` or `../ConversationList`).

## 🚀 Current Focus & Notes

_(Write down what you are currently working on so the AI has immediate context)_

- Currently building the Gaming section and dashboard UI.
- ...

---

**How to use:** Just tell the AI: _"Read the `AI_INSTRUCTIONS.md` file in the Frontend folder before you start"_ and the AI will understand your exact requirements.
