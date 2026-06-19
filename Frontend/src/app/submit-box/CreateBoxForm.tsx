import { FaPlus } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import boxHooks from "@/hooks/useBox";

const boxSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(30, "Title cannot exceed 30 characters"),
  label: z.string().min(2, "Label must be at least 2 characters"),
});

export type BoxFormData = z.infer<typeof boxSchema>;

const CreateBoxForm = () => {
  const { mutate: createBox, isPending } = boxHooks.useCreateBox();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BoxFormData>({
    resolver: zodResolver(boxSchema),
    defaultValues: {
      title: "",
      label: "Roll Number",
    },
  });

  const onSubmit = async (data: BoxFormData) => {
    createBox(data);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FaPlus className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Create New Box</h3>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Add a box with a title and label
          </p>
        </div>
      </div>

      {/* Box Title */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Box Title<span className="text-red-500"> *</span>
        </label>
        <input
          type="text"
          {...register("title")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium ring-blue-200 transition outline-none focus:ring-2"
          placeholder="Enter box title"
          maxLength={30}
        />
        {errors.title && (
          <span className="mt-1 block text-xs font-medium text-red-600">
            {errors.title.message}
          </span>
        )}
      </div>

      {/* Label */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Label<span className="text-red-500"> *</span>
        </label>
        <input
          type="text"
          {...register("label")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium ring-blue-200 transition outline-none focus:ring-2"
          placeholder="Enter box label"
        />
        {errors.label && (
          <span className="mt-1 block text-xs font-medium text-red-600">
            {errors.label.message}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Box"}
        </button>
      </div>
    </form>
  );
};

export default CreateBoxForm;
