import {
  Container,
  Paper,
  Avatar,
  Title,
  Text,
  Grid,
  Card,
  Badge,
  Stack,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { IconUser, IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { EventTypeSummary, Owner } from '../types/api';

export function BookingPage() {
  const navigate = useNavigate();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [eventTypes, setEventTypes] = useState<EventTypeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [ownerData, eventTypesData] = await Promise.all([
          apiClient.fetchOwner(),
          apiClient.fetchEventTypes(),
        ]);

        setOwner(ownerData);
        setEventTypes(eventTypesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEventTypeClick = (eventTypeId: string) => {
    navigate(`/booking/${eventTypeId}`);
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

  return (
    <Container size="lg" py={40} pos="relative">
      <LoadingOverlay visible={loading} />

      {/* Owner Profile Card */}
      <Paper shadow="sm" p="xl" radius="md" withBorder mb="xl">
        <Stack gap="md">
          <Grid align="center">
            <Grid.Col span="content">
              <Avatar size="lg" radius="xl" color="blue">
                <IconUser size={24} />
              </Avatar>
            </Grid.Col>
            <Grid.Col span="auto">
              <Text fw={700} size="lg">
                {owner?.name || 'Загрузка...'}
              </Text>
              <Text size="sm" c="dimmed">
                Host
              </Text>
            </Grid.Col>
          </Grid>

          <Title order={2} mt="xs">
            Выберите тип события
          </Title>
          <Text c="dimmed">
            Нажмите на карточку, чтобы открыть календарь и выбрать удобный слот.
          </Text>
        </Stack>
      </Paper>

      {/* Event Types Grid */}
      <Grid gutter="md">
        {eventTypes.map(eventType => (
          <Grid.Col key={eventType.id} span={{ base: 12, sm: 6 }}>
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => handleEventTypeClick(eventType.id)}
              styles={{
                root: {
                  '&:hover': {
                    borderColor: 'var(--mantine-color-blue-6)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease',
                  },
                },
              }}
            >
              <Stack gap="xs">
                <Grid justify="space-between" align="center">
                  <Grid.Col span="auto">
                    <Text fw={700} size="lg">
                      {eventType.name}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span="content">
                    <Badge variant="light" color="gray" size="sm">
                      {eventType.durationMinutes} мин
                    </Badge>
                  </Grid.Col>
                </Grid>
                <Text size="sm" c="dimmed">
                  {eventType.description}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}
