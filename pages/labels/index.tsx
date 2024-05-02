import { useMemo, useState } from 'react'

import { Button, Card, Divider, Grid, IconButton, InputAdornment, Skeleton, Stack, TextField } from '@mui/material'
import { ParentSize } from '@visx/responsive'
import { SearchIcon } from 'lucide-react'

import Label from '@/components/common/label/Label'
import PageTitle from '@/components/common/page-title'
import WordCloud from '@/components/label/word-cloud'
import Container from '@/layout/container'
import { trpc } from '@/utils/trpc'

const LabelCloud: React.FC = () => {
  const { isFetching, data } = trpc.label.getLabelCount.useQuery()

  const [searchVal, setSearchVal] = useState<string>()

  const words = useMemo(
    () =>
      // limit only top 50
      data
        ?.map(({ label, count }) => ({
          text: label,
          value: count
        }))
        .sort((a, b) => b.value - a.value)
        ?.slice(0, 50) || [],
    [data]
  )

  const searchedData = useMemo(() => data?.filter(({ label }) => label?.toLowerCase()?.includes(searchVal?.toLowerCase() || '')) || [], [data, searchVal])

  return (
    <Container>
      <PageTitle title="Label Word Cloud" />
      <Card sx={{ p: 3 }}>
        {isFetching ? (
          <Stack spacing={1}>
            {new Array(10).fill(1).map((_, index) => (
              <Skeleton key={index} sx={{ height: 34 }} />
            ))}
          </Stack>
        ) : (
          <>
            <div className="w-full h-[500px]">
              <ParentSize>{parent => <WordCloud words={words} width={parent.width} height={parent.height} />}</ParentSize>
            </div>

            <Divider sx={{ mb: 2 }} />
            <div className="flex flex-col items-center">
              <TextField
                className="mb-6 w-[40%] min-w-[200px] sm:w-full"
                placeholder="Search Labels"
                value={searchVal}
                onChange={({ target }) => {
                  setSearchVal(target.value)
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Grid container className="w-full" spacing={2}>
                {searchedData?.map(({ label, count }) => (
                  <Grid item key={label} xs={12} sm={6} xl={3}>
                    <Button variant="soft">
                      <div className="w-full flex justify-between items-center">
                        <div className="flex items-center">
                          <span>{label}</span>
                          <Label className="font-bold ml-3">{count ?? 0}</Label>
                        </div>
                      </div>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </div>
          </>
        )}
      </Card>
    </Container>
  )
}

export default LabelCloud
