import { Outlet } from "react-router-dom";

export default function MarketingLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
        <p className="text-muted-foreground">CRM clínico, automações e campanhas</p>
      </div>
      <Outlet />
    </div>
  );
}
