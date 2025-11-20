import Web3 from "web3";
const web3Instance = new Web3();
const isValidWalletAddress = (walletAddress) => {
  return web3Instance.utils.isAddress(walletAddress);
};
const parseHTMLToBoldText = (html) => {
  // Create a temporary container to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Convert the parsed HTML content to plain text while preserving the <b> and <strong> tags
  return tempDiv.innerHTML;
};

export { isValidWalletAddress, parseHTMLToBoldText };
