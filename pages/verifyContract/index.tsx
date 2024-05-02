/* eslint-disable react/no-unescaped-entities */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { Divider, MenuItem, Stack } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { RHFSelect, RHFTextField } from '@/components/common/hook-form'
import FieldHeader from '@/components/common/hook-form/FieldHeader'
import FormProvider from '@/components/common/hook-form/FormProvider'
import Loading from '@/components/common/loading'
import PageTitle from '@/components/common/page-title'
import { VerifyContractImageIcon } from '@/components/common/svg-icon/verifyContract'
import ContractPublish from '@/components/contract/publish-contract'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { IsZkSync } from '@/constants'
import { contractVerifySchema } from '@/constants/form/contract'
import { l2scan } from '@/constants/text'
import Container from '@/layout/container'
import { ContractCompilerTypeEnum, ZkSyncContractCompilerTypeEnum } from '@/types/contract'
import { trpc } from '@/utils/trpc'

const ContractVerify: React.FC = () => {
  const router = useRouter()
  const search: any = router?.query
  const { contractAddress } = search
  const compilerTypes = IsZkSync ? ZkSyncContractCompilerTypeEnum : ContractCompilerTypeEnum

  const methods = useForm<{
    contractAddress: string
    contractCompilerVersion: string
    contractCompilerType: ContractCompilerTypeEnum | undefined
    zksolcVersion: string | undefined
  }>({
    resolver: zodResolver(contractVerifySchema),
    defaultValues: {
      contractAddress: '',
      contractCompilerType: ContractCompilerTypeEnum.SolidityFile
    }
  })
  const { watch, reset, setValue } = methods
  const verifyFormValues = watch()

  const lang = [ContractCompilerTypeEnum.SolidityFile, ContractCompilerTypeEnum.SolidityJson, ZkSyncContractCompilerTypeEnum.SoliditySourceCode].includes(
    verifyFormValues?.contractCompilerType ?? ContractCompilerTypeEnum.SolidityFile
  )
    ? 'solidity'
    : 'vyper'

  useEffect(() => {
    !!contractAddress && setValue('contractAddress', contractAddress)
  }, [contractAddress, setValue])

  const { isLoading, data: compilerVersions } = trpc.contract.getCompilerVersions.useQuery({ lang: lang })
  const { isLoading: isZkSyncLoading, data: zkSyncCompilerVersions } = trpc.contract.getAllZkSyncCompilerVersions.useQuery({}, { enabled: !!IsZkSync })

  const solcVersions = IsZkSync ? zkSyncCompilerVersions?.solc : compilerVersions
  const zkSolcVersions = zkSyncCompilerVersions?.zksolc
  const vyperVersions = IsZkSync ? zkSyncCompilerVersions?.vyper : compilerVersions
  const zkVyperVersions = zkSyncCompilerVersions?.zkvyper

  if (isLoading || (IsZkSync && isZkSyncLoading))
    return (
      <Container>
        <Loading />
      </Container>
    )

  return (
    <Container>
      <PageTitle title="Verify Contract" />
      <Card>
        <CardHeader>
          <CardTitle>
            <Stack flexDirection={{ sx: 'column', md: 'row' }}>
              <div className="text-sm leading-7 mx-auto text-muted-foreground">
                <p className="mb-3">
                  {`Source code verification provides transparency for users interacting with smart contracts. By uploading the source code, ${l2scan} will match
                  the compiled code with that on the blockchain. Just like contracts, a "smart contract" should provide end users with more information on what
                  they are "digitally signing" for and give users an opportunity to audit the code to independently verify that it actually does what it is
                  supposed to do.`}
                </p>
                <div className="flex flex-col">
                  <Link
                    className="w-fit text-primary"
                    href="https://docs.unifra.io/reference/contract-verification-api"
                    target="_blank"
                    rel="noopener noreferrer">
                    Contract Verification API
                  </Link>
                  <Link
                    className="w-fit text-primary"
                    href="https://docs.unifra.io/reference/how-to-verify-a-smart-contract"
                    target="_blank"
                    rel="noopener noreferrer">
                    Learn more about contract verification
                  </Link>
                </div>
              </div>
            </Stack>
          </CardTitle>
        </CardHeader>

        <Divider className="!mt-0" sx={{ my: 5 }} />

        <div className="px-[4%]">
          <FormProvider methods={methods}>
            <Stack flexDirection={'row'} justifyContent={'center'} alignItems="center">
              <Stack spacing={2} sx={{ width: '100%' }}>
                <Stack spacing={1}>
                  <FieldHeader title="Contract Address" necessary />
                  <RHFTextField placeholder="0x" size="small" name="contractAddress"></RHFTextField>
                </Stack>
                <Stack spacing={1}>
                  <FieldHeader title="Compiler Type" necessary />
                  <RHFSelect
                    name="contractCompilerType"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                      native: false,
                      sx: {
                        textTransform: 'capitalize'
                      }
                    }}>
                    {Object.values(compilerTypes).map(value => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                </Stack>
                {IsZkSync && (
                  <Stack spacing={1}>
                    <FieldHeader title="zkSolc Compiler Version" necessary />
                    <RHFSelect
                      name={`zksolcVersion`}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        native: false,
                        sx: {
                          textTransform: 'capitalize'
                        }
                      }}>
                      {zkSolcVersions?.map((version: string) => (
                        <MenuItem key={version} value={version}>
                          {version}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  </Stack>
                )}
                <Stack spacing={1}>
                  <FieldHeader title={`${lang.charAt(0).toUpperCase() + lang.slice(1)} Compiler Version`} necessary />
                  <RHFSelect
                    name={`contractCompilerVersion`}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                      native: false,
                      sx: {
                        textTransform: 'capitalize'
                      }
                    }}>
                    {solcVersions?.map((version: string) => (
                      <MenuItem key={version} value={version}>
                        {version}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                </Stack>
              </Stack>

              <div className="ml-[8%] px-[50px] w-[350px] sm:hidden ">
                <VerifyContractImageIcon />
              </div>
            </Stack>
          </FormProvider>
        </div>

        <Divider sx={{ my: 5 }} />

        {!!verifyFormValues?.contractAddress &&
          !!verifyFormValues?.contractCompilerType &&
          !!verifyFormValues?.contractCompilerVersion &&
          (IsZkSync ? !!verifyFormValues?.zksolcVersion : true) && (
            <ContractPublish
              contractAddress={verifyFormValues?.contractAddress}
              contractCompilerVersion={verifyFormValues?.contractCompilerVersion}
              zksolcVersion={verifyFormValues?.zksolcVersion}
              contractCompilerType={verifyFormValues?.contractCompilerType}
              resetCompilerConfig={reset}
            />
          )}
      </Card>
    </Container>
  )
}

export default ContractVerify
