import { createClient } from "@/utils/supabase/server";

export async function GET() {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase.from("Service").select("*").limit(5);
		console.log("Supabase Service table fetch:", { data, error });
		return new Response(
			JSON.stringify({ success: !error, data, error }),
			{ status: error ? 500 : 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (err) {
		console.log("Supabase connection error:", err);
		return new Response(
			JSON.stringify({ success: false, error: err.message }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}
