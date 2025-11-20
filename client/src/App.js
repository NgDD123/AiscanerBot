import React from "react";
import "./App.css";
import { AuthProvider } from "./components/pages/AuthContext";

import { StateProvider } from "./components/pages/StateContext";

import AppRoutes from "./AppRoutes";
import AppContextProvider from "./contexts/AppContext";
import { MantineProvider } from "@mantine/core";

function App() {
  return (
    <MantineProvider
      theme={{
        colors: {
          brand: [
            "#F0BBDD",
            "#ED9BCF",
            "#EC7CC3",
            "#ED5DB8",
            "#F13EAF",
            "#F71FA7",
            "#605BFF",
            "#14106d",
            "#C50E82",
            "#AD1374",
          ],
        },
        primaryColor: "brand",
      }}
    >
      <AuthProvider>
        <StateProvider>
          <AppContextProvider>
            <AppRoutes />
          </AppContextProvider>
        </StateProvider>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
