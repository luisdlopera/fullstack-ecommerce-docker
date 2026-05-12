'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type Dispatch, type SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { productsApi } from '@/features/admin';
import type { AdminProduct } from '@/features/admin';

type UploadTaskState = {
  active: boolean;
  total: number;
  completed: number;
  currentFileName: string | null;
  failedCount: number;
};

type PendingRetryUploads = {
  productId: string;
  files: File[];
};

const EMPTY_UPLOAD_TASK: UploadTaskState = {
  active: false,
  total: 0,
  completed: 0,
  currentFileName: null,
  failedCount: 0,
};

export function useProductMutations(
  setEditProduct: Dispatch<SetStateAction<AdminProduct | null>>,
  setDeleteTarget: Dispatch<SetStateAction<AdminProduct | null>>,
) {
  const queryClient = useQueryClient();
  const [editUploadTask, setEditUploadTask] = useState<UploadTaskState>(EMPTY_UPLOAD_TASK);
  const [pendingRetryUploads, setPendingRetryUploads] = useState<PendingRetryUploads | null>(null);

  const runUploadFiles = async ({
    productId,
    files,
    makePrimary,
    setTask,
  }: {
    productId: string;
    files: File[];
    makePrimary: boolean;
    setTask: Dispatch<SetStateAction<UploadTaskState>>;
  }) => {
    const failedFiles: File[] = [];
    setTask({
      active: true,
      total: files.length,
      completed: 0,
      currentFileName: files[0]?.name ?? null,
      failedCount: 0,
    });

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      setTask((prev) => ({ ...prev, currentFileName: file.name }));
      try {
        const shouldBePrimary = makePrimary && index === 0;
        await productsApi.uploadImage(productId, file, shouldBePrimary);
      } catch {
        failedFiles.push(file);
      }
      setTask((prev) => ({
        ...prev,
        completed: index + 1,
        failedCount: failedFiles.length,
      }));
    }

    setTask((prev) => ({ ...prev, active: false, currentFileName: null }));
    return failedFiles;
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => productsApi.update(id, data),
    onSuccess: () => {
      toast.success('Producto actualizado');
      setEditProduct(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      toast.success('Producto eliminado');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({
      productId,
      files,
      makePrimary,
    }: {
      productId: string;
      files: File[];
      makePrimary: boolean;
    }) => {
      const failedFiles = await runUploadFiles({
        productId,
        files,
        makePrimary,
        setTask: setEditUploadTask,
      });
      if (failedFiles.length > 0) {
        throw new Error(`${failedFiles.length} imagen(es) no se pudieron subir`);
      }
      return productsApi.getById(productId);
    },
    onSuccess: (product) => {
      toast.success('Imagen subida');
      setEditProduct(product);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const retryFailedUploadsMutation = useMutation({
    mutationFn: async ({ productId, files }: { productId: string; files: File[] }) => {
      const failedFiles = await runUploadFiles({
        productId,
        files,
        makePrimary: false,
        setTask: setEditUploadTask,
      });
      const product = await productsApi.getById(productId);
      return { product, failedFiles };
    },
    onSuccess: ({ product, failedFiles }) => {
      setEditProduct(product);
      if (failedFiles.length > 0) {
        setPendingRetryUploads({ productId: product.id, files: failedFiles });
        toast.error(`Aun fallan ${failedFiles.length} imagen(es)`);
      } else {
        setPendingRetryUploads(null);
        toast.success('Reintento completado');
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteImageMutation = useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: number }) => {
      await productsApi.deleteImage(productId, imageId);
      return productsApi.getById(productId);
    },
    onSuccess: (product) => {
      toast.success('Imagen eliminada');
      setEditProduct(product);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reorderImagesMutation = useMutation({
    mutationFn: async ({ productId, imageIds }: { productId: string; imageIds: number[] }) => {
      await productsApi.reorderImages(productId, imageIds);
      return productsApi.getById(productId);
    },
    onSuccess: (product) => {
      toast.success('Orden actualizado');
      setEditProduct(product);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => productsApi.delete(id)));
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { succeeded, failed, total: ids.length };
    },
    onSuccess: ({ succeeded, failed }) => {
      if (failed > 0) {
        toast.error(`${failed} producto(s) no se pudieron eliminar`);
      } else {
        toast.success(`${succeeded} producto(s) eliminados`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    mutations: {
      update: updateMutation,
      delete: deleteMutation,
      uploadImage: uploadImageMutation,
      retryFailedUploads: retryFailedUploadsMutation,
      deleteImage: deleteImageMutation,
      reorderImages: reorderImagesMutation,
      bulkDelete: bulkDeleteMutation,
    },
    uploadTask: editUploadTask,
    pendingRetryUploads,
    setPendingRetryUploads,
  };
}
