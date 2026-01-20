"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChangePasswordModal } from "./ChangePasswordModal";

interface ChangePasswordWrapperProps {
  children: React.ReactNode;
  mustChangePassword?: boolean;
}

export function ChangePasswordWrapper({
  children,
  mustChangePassword = false,
}: ChangePasswordWrapperProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (mustChangePassword) {
      setShowModal(true);
    }
  }, [mustChangePassword]);

  const handleSuccess = () => {
    setShowModal(false);
    // Recarregar a página para atualizar a sessão
    router.refresh();
  };

  return (
    <>
      {children}
      <ChangePasswordModal open={showModal} onSuccess={handleSuccess} />
    </>
  );
}
