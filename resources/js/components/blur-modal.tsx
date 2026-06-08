import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { X } from 'lucide-react';

interface BlurModalProps {
    open: boolean;
    title?: string;
    children: ReactNode;
    onClose: () => void;
}

export function BlurModal({ open, title, children, onClose }: BlurModalProps) {
    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Fondo opaco / empañado */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>

                {/* Contenedor */}
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95 translate-y-4"
                        enterTo="opacity-100 scale-100 translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100 translate-y-0"
                        leaveTo="opacity-0 scale-95 translate-y-4"
                    >
                        <DialogPanel className="w-l overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
                            <div className="flex items-center justify-between border-b px-6 py-4">
                                {title && (
                                    <DialogTitle className="text-lg font-semibold text-gray-900">
                                        {title}
                                    </DialogTitle>
                                )}

                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Cerrar modal"
                                    title="Cerrar modal"
                                    className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="px-6 py-5">
                                {children}
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
