"use client"

import { useAccount, useAccountEffect } from "wagmi"
import { Network, NETWORKS, NetworkType, TOKENS } from "./../config"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Token } from "../config"
import { getStepOneURL } from "./urls"
import { useWallet } from "../ChiaWalletManager/WalletContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRight } from "lucide-react"


export default function StepZero() {
  const router = useRouter()
  const [
    tokenSymbol, setTokenSymbol
  ] = useState(TOKENS[0].symbol)

  const token = TOKENS.find((t: Token) => t.symbol === tokenSymbol)!
  const networks: Network[] = Array.from(new Set(
    token.supported.flatMap(info => [info.evmNetworkId, info.coinsetNetworkId])
  )).map((id: string) => NETWORKS.find((n: Network) => n.id === id)!)

  const [
    sourceNetworkId, setSourceNetworkId
  ] = useState(
    token.sourceNetworkType !== NetworkType.EVM ? token.supported[0].coinsetNetworkId : token.supported[0].evmNetworkId
  )
  const [
    destinationNetworkId, setDestinationNetworkId
  ] = useState(
    token.sourceNetworkType === NetworkType.EVM ? token.supported[0].coinsetNetworkId : token.supported[0].evmNetworkId
  )
  const [
    amount, setAmount
  ] = useState("")
  const [
    destinationAddress, setDestinationAddress
  ] = useState("")
  const account = useAccount()

  useAccountEffect({
    onConnect: (account) => {
      if (account?.address !== undefined && NETWORKS.find((n: Network) => n.id === destinationNetworkId)?.type === NetworkType.EVM) {
        setDestinationAddress(account!.address)
      }
    }
  })

  const goToFirstStep = async () => {
    router.push(getStepOneURL({
      sourceNetworkId,
      destinationNetworkId,
      tokenSymbol,
      recipient: destinationAddress,
      amount
    }))
  }

  const { walletConnected, address } = useWallet()

  const updateDestinationAddress = (destNetworkId: string) => {
    if (account?.address !== undefined && NETWORKS.find((n: Network) => n.id === destNetworkId)?.type === NetworkType.EVM) {
      setDestinationAddress(account!.address)
    } else {
      if (walletConnected && address && NETWORKS.find((n: Network) => n.id === destNetworkId)?.type === NetworkType.COINSET) {
        setDestinationAddress(address)
      } else {
        setDestinationAddress("")
      }
    }
  }

  const swapNetworks = () => {
    const temp = sourceNetworkId
    setSourceNetworkId(destinationNetworkId)
    setDestinationNetworkId(temp)

    updateDestinationAddress(temp)
  }

  useEffect(() => {
    if (!address) {
      setDestinationAddress("")
    }
    if (walletConnected && address && NETWORKS.find((n: Network) => n.id === destinationNetworkId)?.type === NetworkType.COINSET) {
      setDestinationAddress(address)
    }
  }, [walletConnected, address, destinationNetworkId])

  const onTokenChange = (newValue: string) => {
    setTokenSymbol(newValue)

    const newToken = TOKENS.find((t: Token) => t.symbol === newValue)!
    setSourceNetworkId(
      newToken.sourceNetworkType !== NetworkType.EVM ?
        newToken.supported[0].coinsetNetworkId : newToken.supported[0].evmNetworkId
    )

    const destNetworkId = newToken.sourceNetworkType === NetworkType.EVM ?
      newToken.supported[0].coinsetNetworkId : newToken.supported[0].evmNetworkId
    setDestinationNetworkId(destNetworkId)
    updateDestinationAddress(destNetworkId)
  }

  return (
    <>
      <div className="max-w-md mx-auto w-full grow flex flex-col justify-center py-8">
        <div className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-right items-center">
                <div className="flex items-center h-[74px] bg-accent border rounded-lg w-full p-1 pl-4">
                  <label htmlFor="tokenSelector" className="text-2xl pr-4 mr-auto">Token</label>
                  <Select defaultValue={tokenSymbol} onValueChange={onTokenChange}>
                    <SelectTrigger id="tokenSelector" className="text-2xl w-[130px] h-full pr-4 border-0 bg-theme-purple hover:opacity-80 rounded-sm">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKENS.map((t: Token) => (
                        <SelectItem key={t.symbol} value={t.symbol} className="text-2xl">{t.symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-accent border border-input rounded-lg p-1 flex items-center justify-between">
                <BlockchainDropdown
                  label="From"
                  options={networks}
                  selectedValue={sourceNetworkId}
                  updateSelectedValue={setSourceNetworkId}
                />
                <Button
                  variant="ghost"
                  type="button"
                  className="mx-2 p-2 border-0 text-neutral-500 hover:opacity-80 rounded-xl"
                  onClick={swapNetworks}
                >
                  {/* <ArrowRight /> */}
                  <ChangeArrow />
                </Button>
                <BlockchainDropdown
                  label="To"
                  options={networks}
                  selectedValue={destinationNetworkId}
                  updateSelectedValue={setDestinationNetworkId}
                />
              </div>
              <Input
                type="text"
                placeholder="Amount"
                className="w-full px-2 py-2 border border-zinc-700 rounded outline-none bg-zinc-800 text-zinc-300 placeholder-zinc-500 text-lg"
                pattern="^\d*(\.\d{0,8})?$"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Input
                type="text"
                disabled
                placeholder="Receive Address"
                className="w-full px-2 py-2 border border-zinc-700 rounded outline-none bg-zinc-800 text-zinc-300 placeholder-zinc-500 text-lg"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
              />
            </div>

            <div className="flex justify-center">
              {
                walletConnected && account?.address !== undefined ? (
                  <Button
                    type="submit"
                    className="w-64 px-2 py-3 text-zinc-100 rounded-3xl bg-green-500 text-secondary hover:bg-green-700 font-semibold transition-colors duration-300"
                    onClick={goToFirstStep}
                    disabled={Boolean(!amount)}
                  >
                    {Boolean(amount) ? "Bridge" : "Enter an Amount"}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="w-64 px-2 py-3 text-zinc-300 rounded-3xl bg-green-900 font-semibold"
                    disabled={true}
                  >
                    Connect wallets first
                  </Button>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


type BlockchainDropdownProps = {
  label: string
  options: Network[]
  selectedValue: string
  updateSelectedValue: (value: string) => void
}
function BlockchainDropdown({ label, options, selectedValue, updateSelectedValue }: BlockchainDropdownProps) {
  return (
    <Select onValueChange={updateSelectedValue} value={selectedValue} defaultValue={selectedValue}>
      <SelectTrigger className="text-2xl border-0 rounded-sm hover:opacity-80 h-16">
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent>
        {options.map((n) => (
          <SelectItem className="text-2xl" key={n.id} value={n.id}>{n.displayName}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}


// https://heroicons.com/ 
function ChangeArrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  )
}
