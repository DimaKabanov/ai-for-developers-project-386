import { AppShell, Container, Group, Anchor, Text } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface AppShellLayoutProps {
  children: ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group justify="space-between" h="100%" align="center">
            <Group gap="xs" align="center">
              <IconCalendar size={24} color="var(--mantine-color-blue-filled)" />
              <Text fw={700} size="lg">
                Calendar
              </Text>
            </Group>

            <Group gap="lg">
              <Anchor
                component={Link}
                to="/booking"
                underline={isActive('/booking') ? 'always' : 'never'}
                fw={isActive('/booking') ? 600 : 400}
                c={isActive('/booking') ? 'blue' : 'dimmed'}
              >
                Записаться
              </Anchor>
              <Anchor
                component={Link}
                to="/admin"
                underline={isActive('/admin') ? 'always' : 'never'}
                fw={isActive('/admin') ? 600 : 400}
                c={isActive('/admin') ? 'blue' : 'dimmed'}
              >
                Админка
              </Anchor>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
