'use client';

import JsonModal from './JsonModal';

interface ViewRecordModalProps {
  record: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewRecordModal({ record, isOpen, onClose }: ViewRecordModalProps) {
  return (
    <JsonModal
      title="View Record"
      subtitle={record?._id ? `Record ID: ${record._id}` : undefined}
      data={record}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}