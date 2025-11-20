import { createContext, useEffect, useState } from "react";
const initialValues = {
  showToggle: false,
  isSideBarOpen: false,
  isSideBarModalOpen: false,
  isTabletMode: false,
  handleCloseSidebar: () => {},
  handleOpenSidebar: () => {},
  handleOpenSidebarModal: () => {},
  handleCloseSidebarModal: () => {},
  handleToggleCollapse: () => {},
};
export const Appcontext = createContext(initialValues);

const AppContextProvider = ({ children }) => {
  const [showToggle, setShowToggle] = useState(false);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [isTabletMode, setTabletMode] = useState(
    window.innerWidth >= 770 && window.innerWidth <= 1289,
  );
  const [isSideBarModalOpen, setIsSidebarModalOpen] = useState(false);
  const handleCloseSidebarModal = () => {
    setIsSidebarModalOpen(false);
  };
  const handleOpenSidebarModal = () => {
    setIsSidebarModalOpen((prev) => !prev);
  };
  const handleCloseSidebar = () => {
    setIsSideBarOpen(false);
  };
  const handleOpenSidebar = () => {
    setIsSideBarOpen(true);
  };
  const handleToggleCollapse = () => {
    setShowToggle((prev) => !prev);
  };
  const handleShowFeedBackModal = () => {
    setShowFeedBackModal((prev) => !prev);
  };
  useEffect(() => {
    const handleResize = () => {
      setTabletMode(window.innerWidth >= 770 && window.innerWidth <= 1289);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
    <Appcontext.Provider
      value={{
        isSideBarOpen,
        showToggle,
        isSideBarModalOpen,
        isTabletMode,
        handleCloseSidebar,
        handleOpenSidebar,
        handleToggleCollapse,
        handleOpenSidebarModal,
        handleCloseSidebarModal,
      }}
    >
      {children}
    </Appcontext.Provider>
  );
};
export default AppContextProvider;
