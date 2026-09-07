import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — FitAI',
  description: 'Privacy Policy for the FitAI Telegram Mini App.',
  robots: 'index,follow',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f8] text-[#1c1c1e]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-[#6b6b76] mt-2">
          FitAI — Fitness AI Mini App · Last updated: {new Date().toISOString().slice(0, 10)}
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold mb-2">1. Overview</h2>
            <p>
              FitAI (&ldquo;the App&rdquo;) is a Telegram Mini App that provides an AI fitness
              coach, custom workout plans, exercise tracking, and a points economy. This policy
              explains what data we collect, why we collect it, and how it is used and protected.
              By using the App, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">2. Data we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Telegram identity</strong> — your Telegram user ID, name, username, and
                language, provided by Telegram when you open the App.
              </li>
              <li>
                <strong>Onboarding profile</strong> — fitness goal, training level, experience,
                training days per week, available equipment, and (optionally) height, weight,
                target weight, age, gender, injuries/limitations and diet.
              </li>
              <li>
                <strong>Workout data</strong> — generated workout plans, exercise completion logs,
                and progress statistics.
              </li>
              <li>
                <strong>Coach conversations</strong> — the messages you exchange with the AI coach.
              </li>
              <li>
                <strong>Photos</strong> — body/form photos you choose to upload for AI analysis.
              </li>
              <li>
                <strong>Points &amp; payments</strong> — your points balance, transaction history,
                and Telegram Stars payment records.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To personalize your workout plans and AI coaching.</li>
              <li>To track your progress and adapt recommendations over time.</li>
              <li>To process points and Telegram Stars payments.</li>
              <li>To provide the AI vision analysis of photos you upload.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">4. Service providers</h2>
            <p>
              We rely on the following processors to operate the App:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>
                <strong>Convex</strong> — database and application backend where your data is
                stored and processed.
              </li>
              <li>
                <strong>DeepSeek</strong> — the AI model provider that generates coach responses
                and analyzes uploaded photos. Messages and photos you submit are sent to DeepSeek
                for processing.
              </li>
              <li>
                <strong>Telegram</strong> — authentication and payment processing via Telegram
                Stars, governed by Telegram&rsquo;s own privacy policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">5. Photos</h2>
            <p>
              Photos you upload are stored temporarily, sent to the AI vision model for analysis,
              and are not used for any other purpose or shared with third parties. The analysis
              result is shown to you and saved in your coach conversation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">6. Data retention &amp; your rights</h2>
            <p>
              Your data is retained for as long as your account is active. You may request access
              to, correction of, or deletion of your personal data at any time by contacting us
              (see below). Deletion requests are honored within a reasonable timeframe, subject
              to any legal or payment-record obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">7. Security</h2>
            <p>
              Access to the App is authenticated through Telegram&rsquo;s signed init-data
              mechanism. Your points balance and transactions are protected by server-side
              validation so client-side tampering cannot credit points. We use commercially
              reasonable safeguards to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">8. Children</h2>
            <p>
              The App is not directed at children. If you are under the age of majority in your
              jurisdiction, you must use the App under the supervision of a parent or guardian.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be reflected by
              the &ldquo;Last updated&rdquo; date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">10. Contact</h2>
            <p>
              For privacy questions or data requests, contact the App administrator through the
              FitAI bot on Telegram.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
