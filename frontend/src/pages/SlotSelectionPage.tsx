import {
  Container,
  Paper,
  Avatar,
  Text,
  Grid,
  Badge,
  Stack,
  LoadingOverlay,
  Alert,
  Button,
  Group,
  ActionIcon,
  Box,
  Divider,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconUser, IconAlertCircle, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { apiClient } from '../api/client';
import type { EventTypeSummary, Owner, Slot } from '../types/api';
import styles from './SlotSelectionPage.module.css';
import { useBookingStore } from '../store/bookingStore';

dayjs.locale('ru');

// Window for booking: today to today + 14 days
const getMinDate = () => new Date();
const getMaxDate = () => dayjs().add(14, 'days').toDate();

export function SlotSelectionPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [eventType, setEventType] = useState<EventTypeSummary | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());

  // Use store for selection state
  const setSlotSelection = useBookingStore(state => state.setSlotSelection);
  const storeEventTypeId = useBookingStore(state => state.eventTypeId);
  const storeSelectedDate = useBookingStore(state => state.selectedDate);
  const storeSlotId = useBookingStore(state => state.slotId);

  // Local state for selection - initialize from store if available and matches current event
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    storeEventTypeId === eventTypeId && storeSelectedDate ? new Date(storeSelectedDate) : null
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    storeEventTypeId === eventTypeId ? storeSlotId : null
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!eventTypeId) return;

      try {
        setLoading(true);
        setError(null);

        const [ownerData, eventTypesData, slotsData] = await Promise.all([
          apiClient.fetchOwner(),
          apiClient.fetchEventTypes(),
          apiClient.fetchAvailableSlots(eventTypeId),
        ]);

        setOwner(ownerData);
        const foundEventType = eventTypesData.find(et => et.id === eventTypeId);
        setEventType(foundEventType || null);
        setSlots(slotsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventTypeId]);

  const filteredSlots = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDateStr = dayjs(selectedDate).format('YYYY-MM-DD');
    return slots.filter(slot => dayjs(slot.startTime).format('YYYY-MM-DD') === selectedDateStr);
  }, [slots, selectedDate]);

  const selectedSlot = useMemo(() => {
    if (!selectedSlotId) return null;
    return slots.find(slot => slot.id === selectedSlotId) || null;
  }, [slots, selectedSlotId]);

  const getAvailableSlotsCountForDate = (date: Date): number => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return slots.filter(
      slot => dayjs(slot.startTime).format('YYYY-MM-DD') === dateStr && slot.isAvailable
    ).length;
  };

  const formatSlotTime = (startTime: string, endTime: string): string => {
    const start = dayjs(startTime).format('HH:mm');
    const end = dayjs(endTime).format('HH:mm');
    return `${start} - ${end}`;
  };

  const formatSelectedDate = (date: Date | null): string => {
    if (!date) return 'Дата не выбрана';
    return dayjs(date).format('dddd, D MMMM');
  };

  const formatSelectedTime = (slot: Slot | null): string => {
    if (!slot) return 'Время не выбрано';
    return dayjs(slot.startTime).format('HH:mm');
  };

  const handleBack = () => {
    navigate('/booking');
  };

  const handleContinue = () => {
    if (!selectedSlot || !eventTypeId || !selectedDate) return;

    // Save selection to store
    setSlotSelection({
      eventTypeId,
      slotId: selectedSlot.id,
      selectedDate: selectedDate.toISOString(),
      selectedTime: selectedSlot.startTime,
    });

    // Navigate without URL params
    navigate(`/booking/${eventTypeId}/confirm`);
  };

  if (error) {
    return (
      <Container size="lg" py={40}>
        <Alert icon={<IconAlertCircle size={16} />} title="Ошибка" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!eventType) {
    return (
      <Container size="lg" py={40}>
        <Alert icon={<IconAlertCircle size={16} />} title="Ошибка" color="red">
          Тип события не найден
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py={40} pos="relative">
      <LoadingOverlay visible={loading} />

      <Grid gutter="lg">
        {/* Left Column: Event Info */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="xl" radius="md" withBorder h="fit-content">
            <Stack gap="md">
              {/* Owner Avatar */}
              <Group>
                <Avatar size="md" radius="xl" color="blue">
                  <IconUser size={20} />
                </Avatar>
                <Stack gap={0}>
                  <Text fw={700}>{owner?.name || 'Загрузка...'}</Text>
                  <Text size="xs" c="dimmed">
                    Организатор
                  </Text>
                </Stack>
              </Group>

              <Divider />

              {/* Event Type Info */}
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <Text fw={700} size="lg">
                    {eventType.name}
                  </Text>
                  <Badge variant="light" color="blue" size="sm">
                    {eventType.durationMinutes} мин
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {eventType.description}
                </Text>
              </Stack>

              <Divider />

              {/* Selected Date */}
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">
                  Выбранная дата
                </Text>
                <Paper p="sm" radius="md" bg="gray.0">
                  <Text fw={500}>{formatSelectedDate(selectedDate)}</Text>
                </Paper>
              </Stack>

              {/* Selected Time */}
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">
                  Выбранное время
                </Text>
                <Paper p="sm" radius="md" bg="gray.0">
                  <Text fw={500}>{formatSelectedTime(selectedSlot)}</Text>
                </Paper>
              </Stack>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Middle Column: Calendar */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={700} size="lg">
                  Календарь
                </Text>
                <Group gap={4}>
                  <ActionIcon
                    variant="light"
                    color="gray"
                    onClick={() => setDate(dayjs(date).subtract(1, 'month').toDate())}
                  >
                    <IconChevronLeft size={20} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="gray"
                    onClick={() => setDate(dayjs(date).add(1, 'month').toDate())}
                  >
                    <IconChevronRight size={20} />
                  </ActionIcon>
                </Group>
              </Group>

              <Text fw={500} tt="capitalize">
                {dayjs(date).format('MMMM YYYY')} г.
              </Text>

              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                date={date}
                onDateChange={setDate}
                locale="ru"
                firstDayOfWeek={1}
                minDate={getMinDate()}
                maxDate={getMaxDate()}
                renderDay={date => {
                  const day = date.getDate();
                  const availableCount = getAvailableSlotsCountForDate(date);
                  const isSelected = selectedDate && dayjs(date).isSame(selectedDate, 'day');
                  const isToday = dayjs(date).isSame(new Date(), 'day');
                  const isDisabled =
                    dayjs(date).isBefore(getMinDate(), 'day') ||
                    dayjs(date).isAfter(getMaxDate(), 'day');

                  return (
                    <Box className={styles.dayContainer}>
                      <Box
                        className={[
                          styles.dayCircle,
                          isSelected ? styles.dayCircleSelected : '',
                          isToday ? styles.dayCircleToday : '',
                          isDisabled ? styles.dayCircleDisabled : '',
                        ].join(' ')}
                      >
                        <Text size="sm" fw={isSelected ? 700 : isToday ? 600 : 400}>
                          {day}
                        </Text>
                      </Box>
                      {availableCount > 0 && !isDisabled && (
                        <Text size="10px" c="dimmed" className={styles.availabilityCount}>
                          {availableCount} св.
                        </Text>
                      )}
                    </Box>
                  );
                }}
                styles={{
                  day: {
                    height: 'auto',
                    minHeight: '44px',
                    padding: '4px 2px 16px 2px',
                  },
                  calendarHeader: {
                    display: 'none',
                  },
                }}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right Column: Slots List */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="xl" radius="md" withBorder h="fit-content">
            <Stack gap="md">
              <Text fw={700} size="lg">
                Статус слотов
              </Text>

              {selectedDate ? (
                <>
                  <Text size="sm" c="dimmed" mb="xs">
                    {dayjs(selectedDate).format('DD MMMM YYYY, dddd')}
                  </Text>

                  <Stack gap="xs">
                    {filteredSlots.length > 0 ? (
                      filteredSlots.map(slot => (
                        <Paper
                          key={slot.id}
                          p="sm"
                          radius="sm"
                          withBorder
                          className={[
                            styles.slotItem,
                            selectedSlotId === slot.id ? styles.slotItemSelected : '',
                            !slot.isAvailable ? styles.slotItemDisabled : '',
                          ].join(' ')}
                          onClick={() => {
                            if (slot.isAvailable) {
                              setSelectedSlotId(slot.id);
                            }
                          }}
                        >
                          <Group justify="space-between" align="center">
                            <Text fw={500} size="sm">
                              {formatSlotTime(slot.startTime, slot.endTime)}
                            </Text>
                            <Badge
                              color={slot.isAvailable ? 'green' : 'red'}
                              variant="light"
                              size="sm"
                              tt="none"
                            >
                              {slot.isAvailable ? 'Свободно' : 'Занято'}
                            </Badge>
                          </Group>
                        </Paper>
                      ))
                    ) : (
                      <Text c="dimmed" ta="center" py="xl">
                        Нет доступных слотов на выбранную дату
                      </Text>
                    )}
                  </Stack>
                </>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  Выберите дату в календаре
                </Text>
              )}

              <Divider />

              {/* Navigation Buttons */}
              <Group justify="space-between" mt="md">
                <Button variant="default" onClick={handleBack}>
                  Назад
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!selectedSlotId}
                  color="blue"
                  variant="filled"
                >
                  Продолжить
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
