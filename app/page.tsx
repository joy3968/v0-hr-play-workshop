"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Mail,
  Phone,
  User,
  Download,
  Sparkles,
  Building2,
  Trash2,
  AlertCircle,
  Edit2,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Contact {
  id: string
  name: string
  company: string
  phone: string
  email: string
  group: string
  workshopGoal: string
  createdAt: string
}

interface Team {
  id: string
  name: string
  createdAt: string
}

export default function ContactSharingApp() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [workshopGoal, setWorkshopGoal] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("")
  const [newTeamName, setNewTeamName] = useState("")
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editingTeamName, setEditingTeamName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [tableExists, setTableExists] = useState(true)
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)

  useEffect(() => {
    fetchTeams()
    fetchContacts()
  }, [])

  const fetchTeams = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("teams").select("*").order("created_at", { ascending: true })

    if (error) {
      if (error.message.includes("Could not find the table")) {
        setTableExists(false)
      }
      return
    }

    if (data) {
      const formattedTeams: Team[] = data.map((team) => ({
        id: team.id,
        name: team.name,
        createdAt: team.created_at,
      }))
      setTeams(formattedTeams)
    }
  }

  const fetchContacts = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false })

    if (error) {
      if (error.message.includes("Could not find the table")) {
        setTableExists(false)
      }
      return
    }

    if (data) {
      setTableExists(true)
      const formattedContacts: Contact[] = data.map((contact) => ({
        id: contact.id,
        name: contact.name,
        company: contact.company,
        phone: contact.phone,
        email: contact.email,
        group: contact.group_name,
        workshopGoal: contact.workshop_goal || "",
        createdAt: contact.created_at,
      }))
      setContacts(formattedContacts)
    }
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTeamName.trim()) {
      alert("팀 이름을 입력해주세요.")
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase.from("teams").insert({ name: newTeamName.trim() }).select().single()

    if (error) {
      if (error.message.includes("duplicate key")) {
        alert("이미 존재하는 팀 이름입니다.")
      } else {
        alert("팀 생성 중 오류가 발생했습니다.")
      }
      return
    }

    if (data) {
      const newTeam: Team = {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
      }
      setTeams([...teams, newTeam])
      setNewTeamName("")
    }
  }

  const updateTeam = async (teamId: string, newName: string) => {
    if (!newName.trim()) {
      alert("팀 이름을 입력해주세요.")
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("teams").update({ name: newName.trim() }).eq("id", teamId)

    if (error) {
      if (error.message.includes("duplicate key")) {
        alert("이미 존재하는 팀 이름입니다.")
      } else {
        alert("팀 이름 변경 중 오류가 발생했습니다.")
      }
      return
    }

    setTeams(teams.map((team) => (team.id === teamId ? { ...team, name: newName.trim() } : team)))

    const oldTeamName = teams.find((t) => t.id === teamId)?.name
    if (oldTeamName) {
      await supabase.from("contacts").update({ group_name: newName.trim() }).eq("group_name", oldTeamName)
      setContacts(contacts.map((c) => (c.group === oldTeamName ? { ...c, group: newName.trim() } : c)))
    }

    setEditingTeamId(null)
    setEditingTeamName("")
  }

  const deleteTeam = async (teamId: string, teamName: string) => {
    const teamContacts = contacts.filter((c) => c.group === teamName)

    if (teamContacts.length > 0) {
      const confirmed = confirm(
        `이 팀에는 ${teamContacts.length}개의 연락처가 있습니다. 팀을 삭제하면 모든 연락처도 함께 삭제됩니다. 계속하시겠습니까?`,
      )
      if (!confirmed) return
    }

    const supabase = createClient()

    if (teamContacts.length > 0) {
      await supabase.from("contacts").delete().eq("group_name", teamName)
    }

    const { error } = await supabase.from("teams").delete().eq("id", teamId)

    if (error) {
      alert("팀 삭제 중 오류가 발생했습니다.")
      return
    }

    setTeams(teams.filter((team) => team.id !== teamId))
    setContacts(contacts.filter((c) => c.group !== teamName))

    if (selectedGroup === teamName) {
      setSelectedGroup("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !company || !phone || !email || !selectedGroup || !workshopGoal) {
      alert("모든 필드를 입력해주세요.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        group_name: selectedGroup,
        name,
        company,
        phone,
        email,
        workshop_goal: workshopGoal,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes("Could not find the table")) {
        setTableExists(false)
        alert("데이터베이스 테이블이 생성되지 않았습니다. SQL 스크립트를 먼저 실행해주세요.")
      } else {
        alert("연락처 추가 중 오류가 발생했습니다.")
      }
      setIsLoading(false)
      return
    }

    if (data) {
      const newContact: Contact = {
        id: data.id,
        name: data.name,
        company: data.company,
        phone: data.phone,
        email: data.email,
        group: data.group_name,
        workshopGoal: data.workshop_goal || "",
        createdAt: data.created_at,
      }
      setContacts([newContact, ...contacts])
    }

    setName("")
    setCompany("")
    setPhone("")
    setEmail("")
    setWorkshopGoal("")
    setIsLoading(false)
  }

  const deleteContact = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("contacts").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting contact:", error)
      alert("연락처 삭제 중 오류가 발생했습니다.")
      return
    }

    const updatedContacts = contacts.filter((contact) => contact.id !== id)
    setContacts(updatedContacts)
  }

  const groupContacts = selectedGroup ? contacts.filter((c) => c.group === selectedGroup) : []

  const exportToExcel = () => {
    const groupData = contacts.filter((c) => c.group === selectedGroup)

    const BOM = "\uFEFF"
    const headers = ["이름", "회사명", "전화번호", "이메일", "워크샵 목표"]
    const rows = groupData.map((contact) => [
      contact.name,
      contact.company,
      contact.phone,
      contact.email,
      contact.workshopGoal,
    ])

    const csvContent =
      BOM +
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const escaped = String(cell).replace(/"/g, '""')
              return `"${escaped}"`
            })
            .join(","),
        )
        .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `연락처-${selectedGroup}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, "")

    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.startsWith("02")) {
      if (numbers.length <= 5) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
      } else if (numbers.length <= 9) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
      } else {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
      }
    } else if (numbers.startsWith("0")) {
      if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      } else if (numbers.length <= 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
      }
    } else {
      if (numbers.length <= 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
      }
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  if (!tableExists) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">데이터베이스 설정 필요</CardTitle>
            </div>
            <CardDescription className="text-base">
              컨택트허브를 사용하기 위해 데이터베이스 테이블을 생성해야 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
              <h3 className="font-semibold text-gray-900 mb-2">다음 단계를 따라주세요:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>화면 우측 상단의 설정 아이콘을 클릭하세요</li>
                <li>"Integrations" 탭으로 이동하세요</li>
                <li>Supabase 통합이 연결되어 있는지 확인하세요</li>
                <li>
                  "Scripts" 섹션에서 다음 스크립트들을 순서대로 실행하세요:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>
                      <code className="px-2 py-1 bg-white rounded text-orange-600 font-mono text-xs">
                        001_create_contacts_table.sql
                      </code>
                    </li>
                    <li>
                      <code className="px-2 py-1 bg-white rounded text-sky-600 font-mono text-xs">
                        002_create_teams_table.sql
                      </code>
                    </li>
                  </ul>
                </li>
                <li>페이지를 새로고침하세요</li>
              </ol>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600"
            >
              페이지 새로고침
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-50 to-orange-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-orange-500 rounded-2xl blur-lg opacity-50" />
              <div className="relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sky-500 to-orange-500 rounded-2xl shadow-xl">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg mb-4">
              <span className="text-base font-bold bg-gradient-to-r from-sky-600 to-sky-700 bg-clip-text text-transparent">
                GS
              </span>
              <span className="text-sm text-gray-400">×</span>
              <span className="text-base font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                캐럿글로벌
              </span>
              <span className="text-base font-bold text-black">플레이 워크샵</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-3 text-balance">
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-orange-600 bg-clip-text text-transparent">
              컨택트허브
            </span>
          </h1>
          <p className="text-sm text-gray-700 text-pretty max-w-2xl mx-auto">
            네트워킹 세션에서 만난 담당자들과 연락처를 공유하고 협업의 시작을 만들어보세요
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-sky-500/5" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-sky-500" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl bg-gradient-to-r from-orange-600 to-sky-600 bg-clip-text text-transparent flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-500" />팀 관리
            </CardTitle>
            <CardDescription className="text-sm">먼저 팀을 생성하고 관리하세요</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <form onSubmit={createTeam} className="flex gap-2 mb-6">
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="새 팀 이름 입력 (예: 개발팀, 마케팅팀)"
                className="h-10 border-2 border-gray-200 focus:border-sky-400"
              />
              <Button
                type="submit"
                className="bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />팀 추가
              </Button>
            </form>

            {teams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">생성된 팀이 없습니다. 먼저 팀을 추가해주세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map((team) => {
                  const teamContacts = contacts.filter((c) => c.group === team.name)
                  const isExpanded = expandedTeamId === team.id

                  return (
                    <div key={team.id} className="rounded-lg border-2 border-gray-100 bg-white overflow-hidden">
                      <div
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                      >
                        {editingTeamId === team.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingTeamName}
                              onChange={(e) => setEditingTeamName(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateTeam(team.id, editingTeamName)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setEditingTeamId(null)
                                setEditingTeamName("")
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                              <div>
                                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{teamContacts.length}명의 연락처</p>
                              </div>
                            </div>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                                onClick={() => {
                                  setEditingTeamId(team.id)
                                  setEditingTeamName(team.name)
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteTeam(team.id, team.name)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                          {teamContacts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">아직 연락처가 없습니다</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {teamContacts.map((contact) => (
                                <div
                                  key={contact.id}
                                  className="p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                      <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Building2 className="w-3 h-3 text-orange-500" />
                                        <span>{contact.company}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Phone className="w-3 h-3 text-sky-500" />
                                        <span>{contact.phone}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Mail className="w-3 h-3 text-orange-500" />
                                        <span>{contact.email}</span>
                                      </div>
                                      {contact.workshopGoal && (
                                        <div className="flex items-start gap-2 text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
                                          <Target className="w-3 h-3 text-sky-500 mt-0.5 flex-shrink-0" />
                                          <span className="line-clamp-2">{contact.workshopGoal}</span>
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteContact(contact.id)}
                                      className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-orange-500/5" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-orange-500" />
            <CardHeader className="relative">
              <CardTitle className="text-2xl bg-gradient-to-r from-sky-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                연락처 입력
              </CardTitle>
              <CardDescription className="text-sm">팀을 선택하고 연락처 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="group" className="text-sm font-semibold text-gray-700">
                    팀 선택
                  </Label>
                  {teams.length === 0 ? (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-sm text-orange-700">
                      먼저 위에서 팀을 생성해주세요.
                    </div>
                  ) : (
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger
                        id="group"
                        className="h-10 border-2 border-gray-200 hover:border-sky-400 transition-colors"
                      >
                        <SelectValue placeholder="팀을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.name}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    이름
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="홍길동"
                      className="pl-10 h-10 border-2 border-gray-200 focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-semibold text-gray-700">
                    회사명
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="회사명"
                      className="pl-10 h-10 border-2 border-gray-200 focus:border-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                    전화번호
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="010-1234-5678"
                      className="pl-10 h-10 border-2 border-gray-200 focus:border-sky-400"
                      maxLength={13}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    이메일
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="pl-10 h-10 border-2 border-gray-200 focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workshopGoal" className="text-sm font-semibold text-gray-700">
                    플레이워크샵을 통해 얻어가고 싶은 것
                  </Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-3 w-4 h-4 text-orange-500" />
                    <Textarea
                      id="workshopGoal"
                      value={workshopGoal}
                      onChange={(e) => setWorkshopGoal(e.target.value)}
                      placeholder="워크샵을 통해 얻고 싶은 것을 자유롭게 작성해주세요"
                      className="pl-10 min-h-[100px] border-2 border-gray-200 focus:border-orange-400 resize-none"
                      rows={4}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || teams.length === 0}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "추가 중..." : "연락처 추가"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-sky-500/5" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-sky-500" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-orange-600 to-sky-600 bg-clip-text text-transparent">
                    팀 연락처
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {selectedGroup ? `${selectedGroup} 팀의 연락처` : "팀을 선택하면 연락처가 표시됩니다"}
                  </CardDescription>
                </div>
                {groupContacts.length > 0 && (
                  <Button
                    onClick={exportToExcel}
                    className="bg-gradient-to-r from-orange-500 to-sky-500 hover:from-orange-600 hover:to-sky-600 shadow-md"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    연락처 다운로드
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative">
              {!selectedGroup ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-orange-400 rounded-full blur-xl opacity-20" />
                    <Users className="relative w-12 h-12 mx-auto text-gray-300" />
                  </div>
                  <p className="text-base">팀을 선택해주세요</p>
                </div>
              ) : groupContacts.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-orange-400 rounded-full blur-xl opacity-20" />
                    <Users className="relative w-12 h-12 mx-auto text-gray-300" />
                  </div>
                  <p className="text-base">아직 입력된 연락처가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupContacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="p-4 rounded-xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg hover:border-sky-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5 flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{contact.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-3.5 h-3.5 text-orange-500" />
                            <span>{contact.company}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-sky-500" />
                            <span>{contact.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-orange-500" />
                            <span>{contact.email}</span>
                          </div>
                          {contact.workshopGoal && (
                            <div className="flex items-start gap-2 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                              <Target className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">워크샵 목표</p>
                                <p className="text-sm">{contact.workshopGoal}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteContact(contact.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
