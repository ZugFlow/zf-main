declare module 'leaflet' {
  export interface IconOptions {
    iconUrl?: string;
    iconRetinaUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
    shadowUrl?: string;
    shadowSize?: [number, number];
    shadowAnchor?: [number, number];
    className?: string;
  }

  export class Icon {
    constructor(options: IconOptions);
    static Default: {
      prototype: {
        _getIconUrl?: string;
      };
      mergeOptions(options: IconOptions): void;
    };
  }

  export const Icon: {
    Default: {
      prototype: {
        _getIconUrl?: string;
      };
      mergeOptions(options: IconOptions): void;
    };
  };
}
