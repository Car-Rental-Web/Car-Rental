const RenterAgreement = () => (
  <div className="w-full min-h-screen flex justify-center items-center pt-3">
    <div className="flex flex-col w-1/2 justify-center items-center gap-3">
      <p>Renter Waiver and Agreement</p>
      <p className="leading-relaxed">
        I,{" "}
        <span className="inline-block border-b border-black w-96 translate-y-1 mx-1"></span>
        , legal age, Agree as follows;
      </p>
      <ol className="list-decimal list-outside space-y-2  flex flex-col gap-1">
        <li>
          The Renter is responsible for any damage that cause while he/she using
          the said vehicle that he/she rent.
        </li>
        <li>
          The Renter is responsible to pay the amount that he/she used while in
          using the said vehicle that he/she rent to the owner.
        </li>
        <li>
          The Renter is responsible to pay the daily rent of the vehicle, while
          being repaired, if ever being damage while he/she using it.
        </li>
        <li>
          The Owner is not responsible for any lost things inside the vehicle
          after being returned to the owner.
        </li>
        <li>
          The Owner has the right to file cases against the renter, if ever
          he/she did not pay the correspond amount that he she/used when he/she
          rent to the said vehicle.
        </li>
        <li className="">
          The Renter has full responsibilities if the said vehicle is being used
          in any illegal activities and the owner is not reliable for any
          illegal activities that being made by the renter, it is the
          responsibilities of the renter.{" "}
          <span>(OWNER DO NOT TOLERATE ILLEGAL ACTIVITIES)</span>{" "}
        </li>
        <li>
          The Owner is not responsible for any payments that the renter if being
          used in any illegal activities or any offenses punishable by the law
          that the renter did.
        </li>
        <li>
          The Renter is instructed to return the vehicle in good condition and
          the used of gasoline or diesel.
        </li>
        <li>
          The Renter is full responsibilities if the vehicle has lost or
          tow/towed by any government agencies.
        </li>
        <li>
          The Owner has the right to pull out his vehicle if the renter voilate
          their contract or lease agreement or didn't pay the correspond daily,
          weekly or monthly rent of his/her vehicle.
        </li>
      </ol>
      <p>
        I am fully aware the full responsibilities of the agreement/waiver that
        being made between my owner/operator and I as a renter of his/her
        vehicle
      </p>
      <div className="flex flex-col pt-15 gap-15 w-full">
        <div className="flex justify-between gap-12">
          <div className="flex flex-col w-full">
            <p></p>
            <p className="border-t border-black w-full">
              RENTER/SIGNATURE OVER PRINTED NAME
            </p>
          </div>
          <div className="w-full">
            <p className="border-t border-black w-full">
              TYPE OF VEHICLE/PLATE#/COLOR
            </p>
          </div>
        </div>
        <div className="flex justify-between gap-12">
          <p className="border-t border-black w-full">
            OWNER/OPERATOR/DISPATCHER
          </p>
          <p className="border-t border-black w-full">
            DATE/TIME-DATE/TIME OF RETURN
          </p>
        </div>
        <div className="flex justify-between gap-12 ">
          <p className="border-t border-black w-full">WITNESS</p>
          <p className="border-t border-black w-full">
            HOURS/DAILY/MONTHLY/RENT
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default RenterAgreement;
