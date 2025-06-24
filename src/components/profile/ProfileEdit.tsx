import { useState, useEffect } from "react";
import { TIMEZONE_OPTIONS } from "@/constants/timezones";
import { Select, SelectItem } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

export default function ProfileEdit({ user }) {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
    timezone: "Asia/Seoul",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      setProfile({
        ...data,
        timezone: data?.timezone || "Asia/Seoul",
      });
    };
    fetchProfile();
  }, [user.id]);

  const handleSave = async () => {
    await supabase
      .from("users")
      .update({
        name: profile.name,
        email: profile.email,
        department: profile.department,
        phone: profile.phone,
        timezone: profile.timezone,
      })
      .eq("id", user.id);
    // 저장 성공 안내 등
  };

  return (
    <form>
      {/* ...이름, 이메일, 부서 등 기존 입력란... */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">시간대</label>
        <Select
          value={profile.timezone}
          onValueChange={(val) => setProfile({ ...profile, timezone: val })}
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </Select>
      </div>
      {/* ... */}
      <button type="button" onClick={handleSave}>
        저장
      </button>
    </form>
  );
} 