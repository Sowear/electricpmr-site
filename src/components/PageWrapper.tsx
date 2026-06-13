import Providers from "./Providers";
import React from "react";

export default function PageWrapper({ Component }: { Component: React.ElementType }) {
  return (
    <Providers>
      <Component />
    </Providers>
  );
}
