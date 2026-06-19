import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import type { BoxFormData } from "@/app/submit-box/CreateBoxForm";
import boxServices from "@/services/box.service";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { handleMutationError } from "@/utils/errorHandler";
import type { AxiosProgressEvent } from "axios";

const useCreateBox = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BoxFormData) => boxServices.createBox(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["active-boxes"] });

      navigate(`/submit-box/${response.data.box.id}`);
      toast.success(response.message);
    },
    onError: handleMutationError("Create box failed"),
  });
};

const useGetActiveBoxes = () => {
  return useQuery({
    queryKey: ["active-boxes"],
    queryFn: () => boxServices.getActiveBoxes(),
  });
};

const useGetBoxDetails = () => {
  const { boxId } = useParams();
  return useQuery({
    queryKey: ["box-details", boxId],
    queryFn: () => boxServices.getBoxDetails(boxId as string),
  });
};

const useDeleteBox = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (boxId: string) => boxServices.deleteBox(boxId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["active-boxes"] });
      toast.success(response.message);
      navigate("/submit-box");
    },
    onError: handleMutationError("Failed to delete box"),
  });
};

const useSubmitFile = () => {
  return useMutation({
    mutationFn: ({
      formData,
      onUploadProgress,
    }: {
      formData: FormData;
      onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
    }) => boxServices.submitFile(formData, onUploadProgress),
    onSuccess: (response) => {
      toast.success(response.message);
    },
    onError: handleMutationError("File submission failed"),
  });
};

const useToggleBoxStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boxId,
      isAccepting,
    }: {
      boxId: string;
      isAccepting: boolean;
    }) => boxServices.toggleBoxStatus(boxId, isAccepting),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["active-boxes"] });
      queryClient.invalidateQueries({
        queryKey: ["box-details", variables.boxId],
      });
      toast.success(response.message);
    },
    onError: handleMutationError("Failed to update box status"),
  });
};

const useDeleteSubmission = () => {
  const queryClient = useQueryClient();
  const { boxId } = useParams();

  return useMutation({
    mutationFn: (submissionId: string) =>
      boxServices.deleteSubmission(submissionId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["box-details", boxId] });
      toast.success(response.message);
    },
    onError: handleMutationError("Failed to delete submission"),
  });
};

const boxHooks = {
  useCreateBox,
  useGetActiveBoxes,
  useGetBoxDetails,
  useDeleteBox,
  useSubmitFile,
  useToggleBoxStatus,
  useDeleteSubmission,
} as const;

export default boxHooks;
