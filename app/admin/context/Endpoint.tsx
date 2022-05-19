import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useState,
} from "react";

export interface EndpointContextState {
  endpoint: string;
  setEndpoint: Dispatch<SetStateAction<string>>;
}

export const EndpointContext = createContext<EndpointContextState>(
  {} as EndpointContextState
);

export const EndpointProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [endpoint, setEndpoint] = useState("http://localhost:8899/");
  return (
    <EndpointContext.Provider value={{ endpoint, setEndpoint }}>
      {children}
    </EndpointContext.Provider>
  );
};
