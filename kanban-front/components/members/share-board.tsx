"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addBoardMember,
  listBoardMembers,
  removeBoardMember,
  updateBoardMemberRole,
  type ShareableRole,
} from "@/features/boards/api";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { useEffect, useState, type FormEvent } from "react";

type Props = {
  boardId: string;
};

const ROLE_OPTIONS: { value: ShareableRole; label: string }[] = [
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Viewer" },
];

const selectClassName =
  "h-10 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground outline-none focus:border-foreground/40";

export function ShareBoard({ boardId }: Props) {
  const {
    boards,
    members,
    addMember,
    setMembersForBoard,
    updateMemberRole,
    removeMember,
    roleFor,
  } = useStore();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ShareableRole>("EDITOR");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const board = boards.find((item) => item.id === boardId);
  const role = user ? roleFor(boardId, user.id) : null;
  const canManage = role === "OWNER";
  const list = members.filter((member) => member.boardId === boardId);

  useEffect(() => {
    let cancelled = false;
    setLoadingMembers(true);
    setError("");
    listBoardMembers(boardId)
      .then((next) => {
        if (cancelled) return;
        setMembersForBoard(boardId, next);
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof ApiError ? cause.message : "Something went wrong.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingMembers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, setMembersForBoard]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setPending(true);
    try {
      const member = await addBoardMember(boardId, {
        email: email.trim(),
        role: inviteRole,
      });
      addMember(member);
      setNotice("Member added.");
      setEmail("");
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onChangeRole(memberId: string, next: ShareableRole) {
    setError("");
    setNotice("");
    setBusyMemberId(memberId);
    try {
      const member = await updateBoardMemberRole(boardId, memberId, next);
      updateMemberRole(member.id, member.role);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      setBusyMemberId(null);
    }
  }

  async function onRemove(memberId: string) {
    setError("");
    setNotice("");
    setBusyMemberId(memberId);
    try {
      await removeBoardMember(boardId, memberId);
      removeMember(memberId);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Something went wrong.",
      );
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Share {board?.name ?? "this board"} with other people.
      </p>
      {error ? <p className="text-sm text-[#E07A5F]">{error}</p> : null}
      {notice ? (
        <p className="text-sm text-muted-foreground">{notice}</p>
      ) : null}

      {canManage ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Role
            </span>
            <select
              className={selectClassName}
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as ShareableRole)
              }
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add member"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only the owner can add or remove members.
        </p>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground">Members</p>
        {loadingMembers ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading members…</p>
        ) : (
        <ul className="mt-2">
          {list.map((member) => {
            const isSelf = user ? member.userId === user.id : false;
            const local = member.email.split("@")[0];
            const canEditMember =
              canManage && member.role !== "OWNER" && busyMemberId !== member.id;
            return (
              <li
                key={member.id}
                className="flex min-h-12 items-center justify-between gap-3 rounded-lg px-1 py-1"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar email={member.email} id={member.userId} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{local}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role.toLowerCase()}
                      {isSelf ? " · you" : ""}
                    </p>
                  </div>
                </div>
                {canManage && member.role !== "OWNER" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      className={cn(selectClassName, "h-8 w-26 px-2")}
                      value={member.role}
                      disabled={!canEditMember}
                      aria-label={`Role for ${member.email}`}
                      onChange={(event) =>
                        onChangeRole(
                          member.id,
                          event.target.value as ShareableRole,
                        )
                      }
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!canEditMember}
                      onClick={() => onRemove(member.id)}
                      className="text-xs text-muted-foreground hover:text-[#E07A5F] disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        )}
      </div>
    </div>
  );
}
