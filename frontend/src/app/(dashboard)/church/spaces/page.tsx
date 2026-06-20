"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, Loader2, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { BuildingFloorPlan } from "@/components/church/church-spaces-planner-dynamic";
import { ChurchReservationsTable } from "@/components/church/church-reservations-table";
import { SpaceReservationCalendarMonth } from "@/components/church/space-reservation-calendar-month";
import { ChurchFixedSchedulesTable } from "@/components/church/church-fixed-schedules-table";
import { ChurchSpacesTable } from "@/components/church/church-spaces-table";
import { BUILDING_FLOORS, isOnFloorPlan } from "@/lib/spaces/floor-layout";
import {
  buildChurchReservationRange,
  churchDayKeyFromDate,
  churchLocalPartsToDate,
  churchWeekdayFromDate,
} from "@/lib/spaces/church-timezone";
import {
  expandReservationsForMonth,
  filterReservationsByDay,
} from "@/lib/spaces/reservation-calendar-utils";
import { dedupeReservationRows } from "@/lib/spaces/reservation-list-utils";
import { startOfMonth } from "@/lib/calendar/class-calendar-utils";
import type {
  ChurchSpace,
  ChurchSpaceReservation,
  ChurchSpaceStatus,
  ChurchSpacesResponse,
  ChurchReservationsResponse,
  ReservationStatus,
  SpaceAvailabilityResponse,
} from "@/lib/types/church-space";
import type { ChurchMinistriesResponse } from "@/lib/types/church-ministry";
import type { UserProfileData } from "@/lib/schemas/profile";
import { userDisplayName } from "@/lib/user-display-name";

type Tab = "floorPlan" | "availability" | "calendar" | "reservations" | "spaces";

const TAB_ORDER: Tab[] = ["floorPlan", "availability", "calendar", "reservations", "spaces"];

const TAB_LABEL_KEYS: Record<Tab, string> = {
  floorPlan: "churchSpaces.tabFloorPlan",
  availability: "churchSpaces.tabAvailability",
  calendar: "churchSpaces.tabCalendar",
  reservations: "churchSpaces.tabReservations",
  spaces: "churchSpaces.tabSpaces",
};

type EditSpaceForm = {
  name: string;
  code: string;
  building: string;
  floor: string;
  description: string;
  capacity: string;
  status: ChurchSpaceStatus;
  color: string;
  amenities: string;
  min_booking_minutes: string;
  max_booking_minutes: string;
  requires_approval: boolean;
  notes: string;
};

const emptyEditSpaceForm: EditSpaceForm = {
  name: "",
  code: "",
  building: "",
  floor: "",
  description: "",
  capacity: "20",
  status: "available",
  color: "#2563eb",
  amenities: "",
  min_booking_minutes: "30",
  max_booking_minutes: "480",
  requires_approval: false,
  notes: "",
};

export default function ChurchSpacesPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthHydrated();
  const canManage = user?.role === "admin" || user?.role === "instructor";
  const isAdmin = user?.role === "admin" || user?.role === "instructor";

  const [tab, setTab] = useState<Tab>("floorPlan");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ChurchSpaceStatus>("");
  const [reservationStatus, setReservationStatus] = useState<"" | ReservationStatus>("");
  const [reservationMonth, setReservationMonth] = useState(() => startOfMonth(new Date()));
  const [reservationSelectedDay, setReservationSelectedDay] = useState(() => new Date());
  const [filterReservationsBySelectedDay, setFilterReservationsBySelectedDay] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editSpaceForm, setEditSpaceForm] = useState<EditSpaceForm>(emptyEditSpaceForm);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<ChurchSpaceReservation | null>(
    null
  );
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);
  const [focusCancelledSeriesKey, setFocusCancelledSeriesKey] = useState<string | null>(null);

  const [newSpace, setNewSpace] = useState({
    name: "",
    code: "",
    building: "",
    floor: "",
    capacity: "20",
    status: "available" as ChurchSpaceStatus,
    color: "#2563eb",
    requires_approval: false,
  });

  const [newReservation, setNewReservation] = useState({
    church_space_id: "",
    church_ministry_id: "",
    title: "",
    purpose: "",
    schedule_date: churchDayKeyFromDate(new Date()),
    attendees_count: "5",
    recurrence_enabled: false,
    recurrence_weekday: "0",
    recurrence_time: "10:00",
    recurrence_interval_weeks: "1",
    recurrence_duration_minutes: "120",
  });

  const oneOffReservationRange = useMemo(
    () =>
      buildChurchReservationRange(
        newReservation.schedule_date,
        newReservation.recurrence_time,
        parseInt(newReservation.recurrence_duration_minutes, 10) || 120
      ),
    [
      newReservation.schedule_date,
      newReservation.recurrence_time,
      newReservation.recurrence_duration_minutes,
    ]
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const enabled = hydrated && !!accessToken;

  const spacesQuery = useQuery({
    queryKey: ["church-spaces", debouncedSearch, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "50" };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<ChurchSpacesResponse>("/v1/spaces", { params });
      return data;
    },
    enabled: enabled && tab !== "spaces",
  });

  const planSpacesQuery = useQuery({
    queryKey: ["church-spaces", "on-plan", debouncedSearch, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "50", on_floor_plan: "1" };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<ChurchSpacesResponse>("/v1/spaces", { params });
      return data;
    },
    enabled: enabled,
  });

  const ministriesQuery = useQuery({
    queryKey: ["church-ministries", "reservation-form"],
    queryFn: async () => {
      const { data } = await api.get<ChurchMinistriesResponse>("/v1/ministries", {
        params: { per_page: "100", status: "active" },
      });
      return data;
    },
    enabled: enabled && showReservationForm,
  });

  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserProfileData }>("/v1/users/profile");
      return data.data;
    },
    enabled: enabled && showReservationForm && !!user,
    staleTime: 60_000,
  });

  const requesterDisplayName = useMemo(
    () => userDisplayName({ ...profileQuery.data, email: user?.email }),
    [profileQuery.data, user?.email]
  );

  const reservationsQuery = useQuery({
    queryKey: ["church-space-reservations", reservationStatus],
    queryFn: async () => {
      const params: Record<string, string> = { per_page: "100" };
      if (reservationStatus) params.status = reservationStatus;
      const { data } = await api.get<ChurchReservationsResponse>("/v1/spaces/reservations", {
        params,
      });
      return data;
    },
    enabled: enabled && (tab === "reservations" || tab === "calendar"),
    refetchInterval: tab === "reservations" || tab === "calendar" ? 30_000 : false,
  });

  const availabilityQuery = useQuery({
    queryKey: ["church-spaces-availability", availabilityDate],
    queryFn: async () => {
      const { data } = await api.get<SpaceAvailabilityResponse>("/v1/spaces/availability", {
        params: { date: availabilityDate },
      });
      return data;
    },
    enabled: enabled && (tab === "availability" || tab === "floorPlan"),
    refetchInterval: tab === "availability" || tab === "floorPlan" ? 30_000 : false,
  });

  const spaces = spacesQuery.data?.data ?? [];
  const planSpaces = planSpacesQuery.data?.data ?? [];
  const activeMinistries = ministriesQuery.data?.data ?? [];

  const occupancyMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of availabilityQuery.data?.data.spaces ?? []) {
      const total = item.slots.length || 1;
      const busy = item.slots.filter((s) => !s.available).length;
      map[item.id] = Math.round((busy / total) * 100);
    }
    return map;
  }, [availabilityQuery.data]);

  const checkAvailability = useMutation({
    mutationFn: async () => {
      if (!oneOffReservationRange) {
        throw new Error("Invalid reservation schedule");
      }
      const { data } = await api.post<{ data: { available: boolean; message: string } }>(
        "/v1/spaces/reservations/check",
        {
          church_space_id: newReservation.church_space_id,
          starts_at: oneOffReservationRange.starts_at,
          ends_at: oneOffReservationRange.ends_at,
          attendees_count: parseInt(newReservation.attendees_count, 10) || 1,
        }
      );
      return data.data;
    },
    onSuccess: (result) => setConflictMsg(result.message),
    onError: (error) => notifyApiError(error),
  });

  const createSpaceMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: ChurchSpace }>("/v1/spaces", {
        name: newSpace.name.trim(),
        code: newSpace.code.trim() || null,
        building: newSpace.building.trim() || null,
        floor: newSpace.floor.trim() || null,
        capacity: parseInt(newSpace.capacity, 10) || 0,
        status: newSpace.status,
        color: newSpace.color,
        requires_approval: newSpace.requires_approval,
      });
      return data;
    },
    onSuccess: () => {
      notifySuccess(t("churchSpaces.createSpaceSuccess"));
      setShowSpaceForm(false);
      queryClient.invalidateQueries({ queryKey: ["church-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["church-spaces-availability"] });
    },
    onError: (e) => notifyApiError(e, t("churchSpaces.createSpaceError")),
  });

  const createReservationMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        church_space_id: newReservation.church_space_id,
        church_ministry_id: newReservation.church_ministry_id,
        title: newReservation.title.trim(),
        purpose: newReservation.purpose.trim() || null,
        attendees_count: parseInt(newReservation.attendees_count, 10) || 1,
      };

      if (newReservation.recurrence_enabled) {
        payload.recurrence = {
          enabled: true,
          weekday: parseInt(newReservation.recurrence_weekday, 10),
          time: newReservation.recurrence_time,
          interval_weeks: parseInt(newReservation.recurrence_interval_weeks, 10) || 1,
          duration_minutes: parseInt(newReservation.recurrence_duration_minutes, 10) || 120,
        };
      } else {
        if (!oneOffReservationRange) {
          throw new Error("Invalid reservation schedule");
        }
        payload.starts_at = oneOffReservationRange.starts_at;
        payload.ends_at = oneOffReservationRange.ends_at;
      }

      const { data } = await api.post<{
        data: ChurchSpaceReservation;
        message: string;
        meta?: { count: number; skipped: number; series_id: string };
      }>("/v1/spaces/reservations", payload);
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("churchSpaces.createReservationSuccess"));
      setShowReservationForm(false);
      setConflictMsg(null);
      queryClient.invalidateQueries({ queryKey: ["church-space-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["church-spaces-availability"] });
    },
    onError: (e) => notifyApiError(e, t("churchSpaces.createReservationError")),
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      const reservation = reservationsQuery.data?.data.find((item) => item.id === id);
      if (reservation?.recurrence_weekday != null) {
        const seriesId = reservation.recurrence_series_id ?? reservation.id;
        await api.post(`/v1/spaces/reservations/series/${seriesId}/cancel`);
        return { id: seriesId, reservation };
      }
      await api.post(`/v1/spaces/reservations/${id}/cancel`);
      return { id, reservation };
    },
    onSuccess: ({ id, reservation }) => {
      notifySuccess(t("churchSpaces.cancelSuccess"));
      const seriesKey =
        reservation?.recurrence_weekday != null
          ? (reservation.recurrence_series_id ?? reservation.id)
          : id;
      setFocusCancelledSeriesKey(seriesKey);
      setReservationStatus("cancelled");
      setFilterReservationsBySelectedDay(false);
      setTab("reservations");
      queryClient.invalidateQueries({ queryKey: ["church-space-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["church-spaces-availability"] });
    },
    onError: (e) => notifyApiError(e),
  });

  const reactivateReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ message: string }>(
        `/v1/spaces/reservations/${id}/reactivate`
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("churchSpaces.reactivateSuccess"));
      setReservationStatus("");
      setFocusCancelledSeriesKey(null);
      setFilterReservationsBySelectedDay(false);
      queryClient.invalidateQueries({ queryKey: ["church-space-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["church-spaces-availability"] });
    },
    onError: (e) => notifyApiError(e, t("churchSpaces.reactivateError")),
  });

  const deleteReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/v1/spaces/reservations/${id}`);
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("churchSpaces.deleteReservationSuccess"));
      setReservationToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["church-space-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["church-spaces-availability"] });
    },
    onError: (e) => notifyApiError(e, t("churchSpaces.deleteReservationError")),
  });

  const approveReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/v1/spaces/reservations/${id}/approve`);
    },
    onSuccess: () => {
      notifySuccess(t("churchSpaces.approveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["church-space-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["church-spaces-availability"] });
    },
    onError: (e) => notifyApiError(e),
  });

  const updateSpaceStatusMutation = useMutation({
    mutationFn: async ({
      spaceId,
      status,
    }: {
      spaceId: string;
      status: ChurchSpaceStatus;
    }) => {
      const { data } = await api.patch<{ data: ChurchSpace; message: string }>(
        `/v1/spaces/${spaceId}`,
        { status }
      );
      return data;
    },
    onSuccess: () => {
      notifySuccess(t("churchSpaces.statusUpdateSuccess"));
      queryClient.invalidateQueries({ queryKey: ["church-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["church-spaces-availability"] });
    },
    onError: (e) => notifyApiError(e, t("churchSpaces.statusUpdateError")),
  });

  const updateSpaceMutation = useMutation({
    mutationFn: async (spaceId: string) => {
      const { data } = await api.patch<{ data: ChurchSpace; message: string }>(
        `/v1/spaces/${spaceId}`,
        {
          name: editSpaceForm.name.trim(),
          code: editSpaceForm.code.trim() || null,
          building: editSpaceForm.building.trim() || null,
          floor: editSpaceForm.floor.trim() || null,
          description: editSpaceForm.description.trim() || null,
          capacity: parseInt(editSpaceForm.capacity, 10) || 0,
          status: editSpaceForm.status,
          color: editSpaceForm.color,
          amenities: editSpaceForm.amenities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          min_booking_minutes: parseInt(editSpaceForm.min_booking_minutes, 10) || 30,
          max_booking_minutes: parseInt(editSpaceForm.max_booking_minutes, 10) || 480,
          requires_approval: editSpaceForm.requires_approval,
          notes: editSpaceForm.notes.trim() || null,
        }
      );
      return data;
    },
    onSuccess: (res) => {
      notifySuccess(res.message || t("churchSpaces.updateSpaceSuccess"));
      setEditingSpaceId(null);
      setEditSpaceForm(emptyEditSpaceForm);
      queryClient.invalidateQueries({ queryKey: ["church-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["church-spaces-availability"] });
    },
    onError: (e) => notifyApiError(e, t("churchSpaces.updateSpaceError")),
  });

  const openEditSpace = (space: ChurchSpace) => {
    setEditingSpaceId(space.id);
    setEditSpaceForm({
      name: space.name,
      code: space.code ?? "",
      building: space.building ?? "",
      floor: space.floor ?? "",
      description: space.description ?? "",
      capacity: String(space.capacity),
      status: space.status,
      color: space.color ?? "#2563eb",
      amenities: space.amenities?.join(", ") ?? "",
      min_booking_minutes: String(space.min_booking_minutes),
      max_booking_minutes: String(space.max_booking_minutes),
      requires_approval: space.requires_approval,
      notes: space.notes ?? "",
    });
  };

  const closeEditSpace = () => {
    setEditingSpaceId(null);
    setEditSpaceForm(emptyEditSpaceForm);
  };

  const spaceStatusLabel = (status: ChurchSpaceStatus) =>
    t(
      status === "available"
        ? "churchSpaces.statusAvailable"
        : status === "maintenance"
          ? "churchSpaces.statusMaintenance"
          : "churchSpaces.statusBlocked"
    );

  const reservationStatusLabel = (status: ReservationStatus) =>
    t(
      status === "confirmed"
        ? "churchSpaces.reservationConfirmed"
        : status === "pending"
          ? "churchSpaces.reservationPending"
          : "churchSpaces.reservationCancelled"
    );

  const reservationItems = useMemo(
    () => dedupeReservationRows(reservationsQuery.data?.data ?? []),
    [reservationsQuery.data]
  );

  const reservationSeriesKey = (reservation: ChurchSpaceReservation) =>
    reservation.recurrence_weekday != null
      ? (reservation.recurrence_series_id ?? reservation.id)
      : reservation.id;

  const activeReservationItems = useMemo(
    () => reservationItems.filter((item) => item.status !== "cancelled"),
    [reservationItems]
  );

  const tableReservationItems = useMemo(() => {
    let items: ChurchSpaceReservation[];
    if (reservationStatus === "cancelled") {
      items = reservationItems.filter((item) => item.status === "cancelled");
      if (focusCancelledSeriesKey) {
        items = items.filter((item) => reservationSeriesKey(item) === focusCancelledSeriesKey);
      }
    } else if (!reservationStatus) {
      items = activeReservationItems;
    } else {
      items = reservationItems.filter((item) => item.status === reservationStatus);
    }
    return items;
  }, [
    reservationItems,
    reservationStatus,
    activeReservationItems,
    focusCancelledSeriesKey,
  ]);

  const reservationCalendarEvents = useMemo(
    () => expandReservationsForMonth(activeReservationItems, reservationMonth, reservationStatus),
    [activeReservationItems, reservationMonth, reservationStatus]
  );

  const filteredReservationItems = useMemo(() => {
    if (!filterReservationsBySelectedDay) return activeReservationItems;
    return filterReservationsByDay(
      activeReservationItems,
      reservationSelectedDay,
      reservationStatus
    );
  }, [
    activeReservationItems,
    filterReservationsBySelectedDay,
    reservationSelectedDay,
    reservationStatus,
  ]);

  const bookableSpaces = useMemo(() => {
    const canvasFloors = new Set<string>(BUILDING_FLOORS);
    return planSpaces
      .filter(
        (s) =>
          s.status === "available" &&
          isOnFloorPlan(s) &&
          canvasFloors.has(s.floor?.trim() ?? "")
      )
      .sort((a, b) => {
        const floorA = a.floor ?? "";
        const floorB = b.floor ?? "";
        if (floorA !== floorB) return floorA.localeCompare(floorB, undefined, { numeric: true });
        return a.name.localeCompare(b.name);
      });
  }, [planSpaces]);

  const bookableSpacesByFloor = useMemo(() => {
    const byFloor = new Map<string, ChurchSpace[]>();
    for (const space of bookableSpaces) {
      const key = space.floor!.trim();
      const list = byFloor.get(key) ?? [];
      list.push(space);
      byFloor.set(key, list);
    }
    return BUILDING_FLOORS.filter((floor) => byFloor.has(floor)).map((floor) => ({
      key: floor,
      label: t("churchSpaces.floorNumber", { n: floor }),
      spaces: byFloor.get(floor)!,
    }));
  }, [bookableSpaces, t]);

  if (!enabled) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("churchSpaces.title")}
        subtitle={t("churchSpaces.subtitle")}
        icon={DoorOpen}
      />

      <div className="flex flex-wrap gap-2 border-b border-border pb-2 dark:border-white/10">
        {TAB_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "bg-brand-primary text-white"
                : "text-muted-foreground hover:bg-muted dark:text-[#A1A6AA] dark:hover:bg-white/10"
            )}
          >
            {t(TAB_LABEL_KEYS[key])}
          </button>
        ))}
      </div>

      {tab === "floorPlan" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="date"
              value={availabilityDate}
              onChange={(e) => setAvailabilityDate(e.target.value)}
              className="w-auto"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                availabilityQuery.refetch();
                spacesQuery.refetch();
              }}
              disabled={availabilityQuery.isFetching}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", availabilityQuery.isFetching && "animate-spin")}
              />
              {t("churchSpaces.refresh")}
            </Button>
            <Button size="sm" onClick={() => setShowReservationForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("churchSpaces.newReservation")}
            </Button>
          </div>
          {spacesQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : (
            <BuildingFloorPlan
              spaces={spaces}
              canEditLayout={canManage}
              occupancy={occupancyMap}
              onSpaceClick={(space) => {
                setNewReservation((prev) => ({
                  ...prev,
                  church_space_id: space.id,
                  title: prev.title || space.name,
                }));
                setShowReservationForm(true);
              }}
              onLayoutSaved={() => {
                queryClient.invalidateQueries({ queryKey: ["church-spaces"] });
              }}
              onSpaceUpdated={() => {
                queryClient.invalidateQueries({ queryKey: ["church-spaces"] });
              }}
            />
          )}
        </section>
      )}

      {tab === "availability" && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="date"
              value={availabilityDate}
              onChange={(e) => setAvailabilityDate(e.target.value)}
              className="w-auto"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => availabilityQuery.refetch()}
              disabled={availabilityQuery.isFetching}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", availabilityQuery.isFetching && "animate-spin")}
              />
              {t("churchSpaces.refresh")}
            </Button>
            <Button size="sm" onClick={() => setShowReservationForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("churchSpaces.newReservation")}
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">{t("churchSpaces.fixedSchedulesTitle")}</h3>
              <p className="text-sm text-muted-foreground dark:text-[#A1A6AA]">
                {t("churchSpaces.fixedSchedulesHint")}
              </p>
            </div>
            <p className="text-xs text-[#A1A6AA]">
              {t("churchSpaces.fixedSchedulesTotal", {
                count: availabilityQuery.data?.data.fixed_schedules?.length ?? 0,
              })}
            </p>
            <ChurchFixedSchedulesTable
              schedules={availabilityQuery.data?.data.fixed_schedules ?? []}
              isLoading={availabilityQuery.isLoading}
              emptyMessage={t("churchSpaces.emptyFixedSchedules")}
              locale={locale}
              t={t}
            />
          </div>
        </section>
      )}

      {tab === "calendar" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setShowReservationForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("churchSpaces.newReservation")}
            </Button>
            <div className="flex flex-wrap gap-2">
              {(["", "confirmed", "pending"] as const).map((s) => (
                <button
                  key={s || "all"}
                  type="button"
                  onClick={() => {
                    setReservationStatus(s);
                    setFocusCancelledSeriesKey(null);
                    setFilterReservationsBySelectedDay(false);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    reservationStatus === s
                      ? "border-brand-primary bg-brand-primary-20 text-white"
                      : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50"
                  )}
                >
                  {s ? reservationStatusLabel(s) : t("churchSpaces.filterAll")}
                </button>
              ))}
            </div>
          </div>

          {reservationsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <SpaceReservationCalendarMonth
                month={reservationMonth}
                selected={reservationSelectedDay}
                events={reservationCalendarEvents}
                onMonthChange={(nextMonth) => {
                  setReservationMonth(nextMonth);
                  setFilterReservationsBySelectedDay(false);
                }}
                onSelectDay={(day) => {
                  setReservationSelectedDay(day);
                  setFilterReservationsBySelectedDay(true);
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#A1A6AA]">
                  {filterReservationsBySelectedDay
                    ? t("churchSpaces.reservationsOnDay", {
                        date: reservationSelectedDay.toLocaleDateString(
                          locale === "en" ? "en-US" : "es-AR",
                          { weekday: "long", day: "numeric", month: "long" }
                        ),
                      })
                    : t("churchSpaces.calendarSelectDayHint")}
                </p>
                {filterReservationsBySelectedDay && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setFilterReservationsBySelectedDay(false)}
                  >
                    {t("churchSpaces.clearDayFilter")}
                  </Button>
                )}
              </div>

              {filterReservationsBySelectedDay && (
                <ChurchReservationsTable
                  reservations={filteredReservationItems}
                  isLoading={false}
                  emptyMessage={t("churchSpaces.noReservationsOnDay")}
                  locale={locale}
                  t={t}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onApprove={(id) => approveReservationMutation.mutate(id)}
                  onCancel={(id) => cancelReservationMutation.mutate(id)}
                  onReactivate={(id) => reactivateReservationMutation.mutate(id)}
                  onDelete={(id) => {
                    const reservation =
                      reservationsQuery.data?.data.find((item) => item.id === id) ?? null;
                    setReservationToDelete(reservation);
                  }}
                  approvingId={
                    approveReservationMutation.isPending
                      ? (approveReservationMutation.variables as string)
                      : null
                  }
                  cancellingId={
                    cancelReservationMutation.isPending
                      ? (cancelReservationMutation.variables as string)
                      : null
                  }
                  reactivatingId={
                    reactivateReservationMutation.isPending
                      ? (reactivateReservationMutation.variables as string)
                      : null
                  }
                  deletingId={
                    deleteReservationMutation.isPending
                      ? (deleteReservationMutation.variables as string)
                      : null
                  }
                />
              )}
            </div>
          )}
        </section>
      )}

      {tab === "reservations" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setShowReservationForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("churchSpaces.newReservation")}
            </Button>
            <div className="flex flex-wrap gap-2">
              {(["", "confirmed", "pending", "cancelled"] as const).map((s) => (
                <button
                  key={s || "all"}
                  type="button"
                  onClick={() => {
                    setReservationStatus(s);
                    setFocusCancelledSeriesKey(null);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    reservationStatus === s
                      ? "border-brand-primary bg-brand-primary-20 text-white"
                      : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50"
                  )}
                >
                  {s ? reservationStatusLabel(s) : t("churchSpaces.filterAll")}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#A1A6AA]">
            {t("churchSpaces.reservationsTotal", {
              count: tableReservationItems.length,
            })}
          </p>

          <ChurchReservationsTable
            reservations={tableReservationItems}
            isLoading={reservationsQuery.isLoading}
            emptyMessage={t("churchSpaces.noReservations")}
            locale={locale}
            t={t}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            onApprove={(id) => approveReservationMutation.mutate(id)}
            onCancel={(id) => cancelReservationMutation.mutate(id)}
            onReactivate={(id) => reactivateReservationMutation.mutate(id)}
            onDelete={(id) => {
              const reservation =
                reservationsQuery.data?.data.find((item) => item.id === id) ?? null;
              setReservationToDelete(reservation);
            }}
            approvingId={
              approveReservationMutation.isPending
                ? (approveReservationMutation.variables as string)
                : null
            }
            cancellingId={
              cancelReservationMutation.isPending
                ? (cancelReservationMutation.variables as string)
                : null
            }
            reactivatingId={
              reactivateReservationMutation.isPending
                ? (reactivateReservationMutation.variables as string)
                : null
            }
            deletingId={
              deleteReservationMutation.isPending
                ? (deleteReservationMutation.variables as string)
                : null
            }
          />
        </section>
      )}

      {tab === "spaces" && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-[220px] flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A6AA]" />
              <Input
                className="pl-9 dark:border-white/10 dark:bg-white/5"
                placeholder={t("churchSpaces.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => setTab("floorPlan")}>
              {t("churchSpaces.tabFloorPlan")}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground dark:text-[#A1A6AA]">
            {t("churchSpaces.spacesListHint")}
          </p>

          <div className="flex flex-wrap gap-2">
            {(["", "available", "maintenance", "blocked"] as const).map((status) => (
              <button
                key={status || "all"}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  statusFilter === status
                    ? "border-brand-primary bg-brand-primary-20 text-white"
                    : "border-white/10 text-[#A1A6AA] hover:border-brand-hover-50"
                )}
              >
                {status ? spaceStatusLabel(status) : t("churchSpaces.filterAll")}
              </button>
            ))}
          </div>

          {!canManage && (
            <p className="text-sm text-muted-foreground dark:text-[#A1A6AA]">
              {t("churchSpaces.viewOnlySpaces")}
            </p>
          )}

          <p className="text-xs text-[#A1A6AA]">
            {t("churchSpaces.spacesTotal", {
              count: planSpacesQuery.data?.meta?.total ?? planSpaces.length,
            })}
            {planSpacesQuery.data?.summary && (
              <>
                {" · "}
                {t("churchSpaces.statusAvailable")}: {planSpacesQuery.data.summary.available}
                {" · "}
                {t("churchSpaces.statusMaintenance")}: {planSpacesQuery.data.summary.maintenance}
                {" · "}
                {t("churchSpaces.statusBlocked")}: {planSpacesQuery.data.summary.blocked}
              </>
            )}
          </p>

          <ChurchSpacesTable
            spaces={planSpaces}
            isLoading={planSpacesQuery.isLoading}
            emptyMessage={t("churchSpaces.emptyPlanSpaces")}
            t={t}
            canManage={canManage}
            onEdit={canManage ? openEditSpace : undefined}
            onStatusChange={(space, status) =>
              updateSpaceStatusMutation.mutate({ spaceId: space.id, status })
            }
            updatingStatusId={
              updateSpaceStatusMutation.isPending
                ? updateSpaceStatusMutation.variables?.spaceId ?? null
                : null
            }
            onSpaceClick={
              canManage
                ? undefined
                : (space) => {
                    setNewReservation((prev) => ({
                      ...prev,
                      church_space_id: space.id,
                      title: prev.title || space.name,
                    }));
                    setShowReservationForm(true);
                  }
            }
          />
        </section>
      )}

      {showSpaceForm && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("churchSpaces.newSpace")}</h2>
            <div className="space-y-3">
              <Input
                placeholder={t("churchSpaces.fieldName")}
                value={newSpace.name}
                onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
              />
              <Input
                placeholder={t("churchSpaces.fieldCode")}
                value={newSpace.code}
                onChange={(e) => setNewSpace({ ...newSpace, code: e.target.value })}
              />
              <Input
                placeholder={t("churchSpaces.fieldBuilding")}
                value={newSpace.building}
                onChange={(e) => setNewSpace({ ...newSpace, building: e.target.value })}
              />
              <Input
                placeholder={t("churchSpaces.fieldFloor")}
                value={newSpace.floor}
                onChange={(e) => setNewSpace({ ...newSpace, floor: e.target.value })}
              />
              <Input
                type="number"
                placeholder={t("churchSpaces.fieldCapacity")}
                value={newSpace.capacity}
                onChange={(e) => setNewSpace({ ...newSpace, capacity: e.target.value })}
              />
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newSpace.status}
                onChange={(e) =>
                  setNewSpace({ ...newSpace, status: e.target.value as ChurchSpaceStatus })
                }
              >
                <option value="available">{t("churchSpaces.statusAvailable")}</option>
                <option value="maintenance">{t("churchSpaces.statusMaintenance")}</option>
                <option value="blocked">{t("churchSpaces.statusBlocked")}</option>
              </select>
              <label className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{t("churchSpaces.fieldColor")}</span>
                <input
                  type="color"
                  value={newSpace.color}
                  onChange={(e) => setNewSpace({ ...newSpace, color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSpaceForm(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={() => createSpaceMutation.mutate()}
                disabled={!newSpace.name.trim() || createSpaceMutation.isPending}
              >
                {t("common.create")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {editingSpaceId && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="mb-1 text-lg font-semibold">{t("churchSpaces.editSpace")}</h2>
            <p className="mb-4 text-sm text-muted-foreground dark:text-[#A1A6AA]">
              {t("churchSpaces.editSpaceHint")}
            </p>
            <div className="space-y-3">
              <Input
                placeholder={t("churchSpaces.fieldName")}
                value={editSpaceForm.name}
                onChange={(e) => setEditSpaceForm({ ...editSpaceForm, name: e.target.value })}
              />
              <Input
                placeholder={t("churchSpaces.fieldCode")}
                value={editSpaceForm.code}
                onChange={(e) => setEditSpaceForm({ ...editSpaceForm, code: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder={t("churchSpaces.fieldBuilding")}
                  value={editSpaceForm.building}
                  onChange={(e) =>
                    setEditSpaceForm({ ...editSpaceForm, building: e.target.value })
                  }
                />
                <Input
                  placeholder={t("churchSpaces.fieldFloor")}
                  value={editSpaceForm.floor}
                  onChange={(e) => setEditSpaceForm({ ...editSpaceForm, floor: e.target.value })}
                />
              </div>
              <Textarea
                placeholder={t("churchSpaces.fieldDescription")}
                value={editSpaceForm.description}
                onChange={(e) =>
                  setEditSpaceForm({ ...editSpaceForm, description: e.target.value })
                }
                rows={2}
              />
              <Input
                type="number"
                min={0}
                placeholder={t("churchSpaces.fieldCapacity")}
                value={editSpaceForm.capacity}
                onChange={(e) =>
                  setEditSpaceForm({ ...editSpaceForm, capacity: e.target.value })
                }
              />
              <Input
                placeholder={t("churchSpaces.fieldAmenities")}
                value={editSpaceForm.amenities}
                onChange={(e) =>
                  setEditSpaceForm({ ...editSpaceForm, amenities: e.target.value })
                }
              />
              <p className="-mt-1 text-xs text-muted-foreground dark:text-[#A1A6AA]">
                {t("churchSpaces.fieldAmenitiesHint")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {t("churchSpaces.fieldMinBooking")}
                  </label>
                  <Input
                    type="number"
                    min={15}
                    value={editSpaceForm.min_booking_minutes}
                    onChange={(e) =>
                      setEditSpaceForm({ ...editSpaceForm, min_booking_minutes: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {t("churchSpaces.fieldMaxBooking")}
                  </label>
                  <Input
                    type="number"
                    min={15}
                    value={editSpaceForm.max_booking_minutes}
                    onChange={(e) =>
                      setEditSpaceForm({ ...editSpaceForm, max_booking_minutes: e.target.value })
                    }
                  />
                </div>
              </div>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editSpaceForm.status}
                onChange={(e) =>
                  setEditSpaceForm({
                    ...editSpaceForm,
                    status: e.target.value as ChurchSpaceStatus,
                  })
                }
              >
                <option value="available">{t("churchSpaces.statusAvailable")}</option>
                <option value="maintenance">{t("churchSpaces.statusMaintenance")}</option>
                <option value="blocked">{t("churchSpaces.statusBlocked")}</option>
              </select>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editSpaceForm.requires_approval}
                  onChange={(e) =>
                    setEditSpaceForm({ ...editSpaceForm, requires_approval: e.target.checked })
                  }
                />
                {t("churchSpaces.requiresApproval")}
              </label>
              <label className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{t("churchSpaces.fieldColor")}</span>
                <input
                  type="color"
                  value={editSpaceForm.color}
                  onChange={(e) => setEditSpaceForm({ ...editSpaceForm, color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent"
                />
              </label>
              <Textarea
                placeholder={t("churchSpaces.fieldNotes")}
                value={editSpaceForm.notes}
                onChange={(e) => setEditSpaceForm({ ...editSpaceForm, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={closeEditSpace}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={() => updateSpaceMutation.mutate(editingSpaceId)}
                disabled={!editSpaceForm.name.trim() || updateSpaceMutation.isPending}
              >
                {t("common.save")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showReservationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("churchSpaces.newReservation")}</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="reservation-space"
                  className="text-sm font-medium text-foreground"
                >
                  {t("churchSpaces.colSpace")}
                </label>
                <select
                  id="reservation-space"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newReservation.church_space_id}
                  onChange={(e) =>
                    setNewReservation({ ...newReservation, church_space_id: e.target.value })
                  }
                >
                  <option value="">{t("churchSpaces.selectSpace")}</option>
                  {bookableSpacesByFloor.map((group) => (
                    <optgroup key={group.key} label={group.label}>
                      {group.spaces.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.capacity} {t("churchSpaces.attendees")})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <Input
                placeholder={t("churchSpaces.fieldTitle")}
                value={newReservation.title}
                onChange={(e) => setNewReservation({ ...newReservation, title: e.target.value })}
              />
              <Input
                placeholder={t("churchSpaces.fieldPurpose")}
                value={newReservation.purpose}
                onChange={(e) =>
                  setNewReservation({ ...newReservation, purpose: e.target.value })
                }
              />
              <div className="space-y-1">
                <label
                  htmlFor="reservation-ministry"
                  className="text-sm font-medium text-foreground"
                >
                  {t("churchSpaces.fieldMinistry")}
                </label>
                <select
                  id="reservation-ministry"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newReservation.church_ministry_id}
                  onChange={(e) =>
                    setNewReservation({ ...newReservation, church_ministry_id: e.target.value })
                  }
                  disabled={ministriesQuery.isLoading}
                >
                  <option value="">{t("churchSpaces.selectMinistry")}</option>
                  {activeMinistries.map((ministry) => (
                    <option key={ministry.id} value={ministry.id}>
                      {ministry.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="reservation-requester" className="text-sm font-medium text-foreground">
                  {t("churchSpaces.fieldRequester")}
                </label>
                <Input
                  id="reservation-requester"
                  value={requesterDisplayName === "—" ? "" : requesterDisplayName}
                  title={user?.email ?? ""}
                  readOnly
                  disabled
                  className="cursor-default bg-muted/40"
                />
              </div>
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-input p-3">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={newReservation.recurrence_enabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    if (enabled && newReservation.schedule_date) {
                      const [year, month, day] = newReservation.schedule_date.split("-").map(Number);
                      const date = churchLocalPartsToDate(year, month - 1, day, 12, 0);
                      setNewReservation({
                        ...newReservation,
                        recurrence_enabled: true,
                        recurrence_weekday: String(churchWeekdayFromDate(date)),
                      });
                    } else {
                      setNewReservation({ ...newReservation, recurrence_enabled: enabled });
                    }
                  }}
                />
                <span>
                  <span className="block text-sm font-medium">{t("churchSpaces.recurrenceFixed")}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("churchSpaces.recurrenceFixedHint")}
                  </span>
                </span>
              </label>
              <div className="space-y-3 rounded-md border border-dashed border-input p-3">
                {newReservation.recurrence_enabled ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {t("churchSpaces.recurrenceWeekday")}
                      </label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={newReservation.recurrence_weekday}
                        onChange={(e) =>
                          setNewReservation({ ...newReservation, recurrence_weekday: e.target.value })
                        }
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                          <option key={d} value={String(d)}>
                            {t(`churchSpaces.weekdayShort${d}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {t("churchSpaces.recurrenceInterval")}
                      </label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={newReservation.recurrence_interval_weeks}
                        onChange={(e) =>
                          setNewReservation({
                            ...newReservation,
                            recurrence_interval_weeks: e.target.value,
                          })
                        }
                      >
                        <option value="1">{t("churchSpaces.recurrenceWeekly")}</option>
                        <option value="2">{t("churchSpaces.recurrenceBiweekly")}</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t("churchSpaces.fieldDate")}
                    </label>
                    <Input
                      type="date"
                      value={newReservation.schedule_date}
                      onChange={(e) =>
                        setNewReservation({ ...newReservation, schedule_date: e.target.value })
                      }
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {t("churchSpaces.recurrenceTime")}
                  </label>
                  <Input
                    type="time"
                    value={newReservation.recurrence_time}
                    onChange={(e) =>
                      setNewReservation({ ...newReservation, recurrence_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {t("churchSpaces.recurrenceDuration")}
                  </label>
                  <Input
                    type="number"
                    min={15}
                    max={720}
                    value={newReservation.recurrence_duration_minutes}
                    onChange={(e) =>
                      setNewReservation({
                        ...newReservation,
                        recurrence_duration_minutes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <Input
                type="number"
                min={1}
                placeholder={t("churchSpaces.fieldAttendees")}
                value={newReservation.attendees_count}
                onChange={(e) =>
                  setNewReservation({ ...newReservation, attendees_count: e.target.value })
                }
              />
              {conflictMsg && (
                <p
                  className={cn(
                    "text-sm",
                    conflictMsg.includes("disponible") || conflictMsg.includes("available")
                      ? "text-green-600"
                      : "text-destructive"
                  )}
                >
                  {conflictMsg}
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowReservationForm(false)}>
                {t("common.cancel")}
              </Button>
              {!newReservation.recurrence_enabled && (
                <Button
                  variant="outline"
                  disabled={
                    !newReservation.church_space_id ||
                    !newReservation.church_ministry_id ||
                    !newReservation.schedule_date ||
                    !newReservation.recurrence_time ||
                    !oneOffReservationRange
                  }
                  onClick={() => checkAvailability.mutate()}
                >
                  {t("churchSpaces.checkAvailability")}
                </Button>
              )}
              <Button
                onClick={() => createReservationMutation.mutate()}
                disabled={
                  !newReservation.church_space_id ||
                  !newReservation.church_ministry_id ||
                  !newReservation.title.trim() ||
                  !newReservation.recurrence_time ||
                  (!newReservation.recurrence_enabled &&
                    (!newReservation.schedule_date || !oneOffReservationRange)) ||
                  createReservationMutation.isPending
                }
              >
                {t("churchSpaces.confirmReservation")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Dialog
        open={reservationToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setReservationToDelete(null);
        }}
      >
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 dark:border-white/10 dark:bg-[#1c1c22]">
          <CardHeader className="border-b border-border/60 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle>{t("churchSpaces.deleteReservationTitle")}</CardTitle>
                <CardDescription className="mt-1.5 text-left dark:text-[#A1A6AA]">
                  {t("churchSpaces.deleteReservationConfirm")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {reservationToDelete && (
            <CardContent className="py-5">
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <p className="font-medium text-foreground dark:text-white">
                  {reservationToDelete.title}
                </p>
                {reservationToDelete.space?.name && (
                  <p className="mt-1 text-muted-foreground dark:text-[#A1A6AA]">
                    {reservationToDelete.space.name}
                  </p>
                )}
              </div>
            </CardContent>
          )}

          <CardFooter className="justify-end gap-2 border-t border-border/60 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReservationToDelete(null)}
              disabled={deleteReservationMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteReservationMutation.isPending || !reservationToDelete}
              onClick={() => {
                if (reservationToDelete) {
                  deleteReservationMutation.mutate(reservationToDelete.id);
                }
              }}
            >
              {deleteReservationMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t("churchSpaces.deleteReservation")}
            </Button>
          </CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
