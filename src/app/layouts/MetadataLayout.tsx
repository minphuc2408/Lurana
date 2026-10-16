import { Outlet } from 'react-router';
import { useRouteMetadata } from './hooks/useRouteMetadata';

export function MetadataLayout() {
  useRouteMetadata();
  return <Outlet />;
}
