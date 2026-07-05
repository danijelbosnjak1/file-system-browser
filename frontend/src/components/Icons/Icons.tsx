import './Icons.css';
import searchIcon from '../../assets/icons/search.svg';
import folderIcon from '../../assets/icons/folder.svg';
import filePlusIcon from '../../assets/icons/file-plus.svg';
import folderPlusIcon from '../../assets/icons/folder-plus.svg';
import trashIcon from '../../assets/icons/trash.svg';
import chevronDownIcon from '../../assets/icons/chevron-down.svg';

type SvgIconProps = {
  src: string;
  alt?: string;
  className: string;
};

function SvgIcon({ src, alt = '', className }: SvgIconProps) {
  return <img className={className} src={src} alt={alt} aria-hidden={alt ? undefined : true} />;
}

export function SearchIcon() {
  return <SvgIcon src={searchIcon} className="icon search-icon" />;
}

export function FolderIcon() {
  return <SvgIcon src={folderIcon} className="icon folder-icon" />;
}

export function FilePlusIcon() {
  return <SvgIcon src={filePlusIcon} className="icon file-plus-icon" />;
}

export function FolderPlusIcon() {
  return <SvgIcon src={folderPlusIcon} className="icon folder-plus-icon" />;
}

export function TrashIcon() {
  return <SvgIcon src={trashIcon} className="icon trash-icon" />;
}

export function ChevronDownIcon() {
  return <SvgIcon src={chevronDownIcon} className="icon chevron-down-icon" />;
}

export function FileIcon() {
  return <span className="file-icon" aria-hidden="true" />;
}
