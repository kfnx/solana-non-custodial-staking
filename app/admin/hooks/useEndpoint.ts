import { useContext } from "react";
import { EndpointContext, EndpointContextState } from "../context/Endpoint";

export function useEndpoint(): EndpointContextState {
  return useContext(EndpointContext);
}
