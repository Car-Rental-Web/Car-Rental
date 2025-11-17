export interface LinksPath {
  className?: string;
  urlDashBoard: string;
  dashboard?: string;
  recent?: string;
  folder?: string;
  otherfolder?: string;
  urlFolder?: string;

}

export interface CustomLinksTypes {
  className?: string;
  text?: string;
  url: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onclick?: () => void;
}

export interface CustomButtonTypes {
  className?: string;
  children: React.ReactNode;
  handleclick?: () => void;

}