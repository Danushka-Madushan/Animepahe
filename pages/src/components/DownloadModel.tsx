import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/react";
import DownloadListItem from './DownloadListItem';

interface DownloadModelProps {
  links: {
    link: string,
    name: string
  }[],
  isOpen: boolean,
  onOpenChange: () => void,
  epName: string
}

const DownloadModel = ({ isOpen, onOpenChange, links, epName }: DownloadModelProps) => {
  return (
    <Modal backdrop='blur' isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} isKeyboardDismissDisabled={true}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-center">{epName}</ModalHeader>
            <ModalBody className='mb-4'>
              {
                links.map(({ link, name }) => <DownloadListItem key={link} name={name} link={link} />)
              }
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default DownloadModel
