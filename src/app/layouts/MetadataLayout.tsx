import { useRouteScroll } from './hooks/useRouteScroll';
import { Outlet } from 'react-router';
import { useRouteMetadata } from './hooks/useRouteMetadata';

export function MetadataLayout() {
  useRouteMetadata();
  useRouteScroll();
  return <Outlet />;
}
