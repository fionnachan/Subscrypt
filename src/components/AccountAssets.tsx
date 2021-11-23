import AssetRow from "./AssetRow";
import { IAssetData } from "../helpers/types";
import { getAlgoAssetData } from "./Wallet/utils";

const AccountAssets = (props: { assets: IAssetData[] }) => {
  const { assets } = props;
  const nativeCurrency = getAlgoAssetData(assets);
  const tokens = assets.filter((asset: IAssetData) => asset && asset.id !== 0);

  return (
    <div>
      <h2>Account Balance</h2>
      <AssetRow key={nativeCurrency.id} asset={nativeCurrency} />
      {tokens.map(token => (
        <AssetRow key={token.id} asset={token} />
      ))}
    </div>
  );
};

export default AccountAssets;
