import PageTitle from '@/components/common/page-title'
import TabCard from '@/components/common/tab-card'
import TokenTable from '@/components/tokens/token-table'
import TokenTxsTable from '@/components/tokens/token-txs-table'
import { TokenTypeEnum } from '@/types'

const TitleData = {
  [TokenTypeEnum.ERC20]: { title: 'Token Tracker', label: 'ERC-20' },
  [TokenTypeEnum.ERC721]: {
    title: 'Non-Fungible Token Tracker',
    label: 'ERC-721'
  },
  [TokenTypeEnum.ERC1155]: {
    title: 'Multi-Token Token Tracker',
    label: 'ERC-1155'
  }
}

const TokenPage: React.FC<{ type: TokenTypeEnum }> = ({ type }) => (
  <>
    <PageTitle
      title={
        <div className="flex items-center gap-2">
          <div>{TitleData?.[type]?.title}</div>
          <div className="rounded p-2 bg-card text-card-foreground text-sm">{TitleData?.[type]?.label}</div>
        </div>
      }
    />
    <TabCard
      tabList={[
        {
          label: `${TitleData?.[type]?.label} Top Tokens`,
          children: <TokenTable type={type} />
        },
        {
          label: `${TitleData?.[type]?.label} Transfers`,
          children: <TokenTxsTable type={type} />
        }
      ]}
    />
  </>
)

export default TokenPage
